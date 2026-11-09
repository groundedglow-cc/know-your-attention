import { CAT, DOG, createGame } from './engine.js?v=3';
import { createSounds } from './sound.js?v=3';
import { catPiece, robotPiece } from './art.js?v=3';

const $ = (sel) => document.querySelector(sel);

const storage = {
  getItem(k) { try { return localStorage.getItem(k); } catch { return null; } },
  setItem(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

const CN_NUM = { 3: '三', 4: '四', 5: '五' };

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sounds = createSounds({
  createContext: () => new (window.AudioContext || window.webkitAudioContext)(),
  storage,
});

// Difficulty presets bundle board size + win length + computer strategy, so
// degenerate combos (like 3-in-a-row on a 4×4 board) are never exposed.
const DIFFICULTIES = {
  easy: { size: 3, winLength: 3, ai: 'random', hint: '3×3 · 三连' },
  medium: { size: 4, winLength: 4, ai: 'oneply', hint: '4×4 · 四连' },
  hard: { size: 4, winLength: 4, ai: 'minimax', hint: '4×4 · 四连 · 更聪明' },
};

function loadDifficulty() {
  let d = storage.getItem('tictactoe-difficulty');
  if (d === 'challenge') d = 'medium'; // migrate the old value
  return DIFFICULTIES[d] ? d : 'easy';
}

// ---- 状态 ----
let mode = 'computer'; // 'computer' | 'family'
let difficulty = loadDifficulty();
let tutorialDone = storage.getItem('tictactoe-tutorial-done') === '1';
let familyStarter = CAT;

let game = createGame(DIFFICULTIES[difficulty].size, DIFFICULTIES[difficulty].winLength);
let board = Array(game.cells).fill(null);
let currentPlayer = CAT;
let gameState = { state: 'playing' };
let locked = false;
let pendingStartMode = null;
let finishingTutorial = false;
let pressIndex = -1;
let pressCancelled = false;
let hintHaloEl = null;

const timers = new Set();
function schedule(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id);
  return id;
}
function clearTimers() {
  for (const id of timers) clearTimeout(id);
  timers.clear();
}

// ---- 工具 ----
function cellEl(i) { return $('#board').children[i]; }
function cellLabel(i, occupant) {
  const row = Math.floor(i / game.size) + 1;
  const col = (i % game.size) + 1;
  const who = occupant === CAT ? '小猫' : occupant === DOG ? '机器人' : '空格';
  return `第${row}行第${col}列，${who}`;
}

function showScreen(name) {
  $('#home').hidden = name !== 'home';
  $('#game').hidden = name !== 'game';
}

// ---- 棋盘渲染 ----
function renderBoard() {
  const boardEl = $('#board');
  boardEl.style.gridTemplateColumns = `repeat(${game.size}, 1fr)`;
  boardEl.dataset.size = game.size;
  boardEl.innerHTML = '';
  for (let i = 0; i < game.cells; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.index = i;
    btn.setAttribute('aria-label', cellLabel(i, null));
    btn.addEventListener('pointerdown', (e) => onPointerDown(i, e));
    btn.addEventListener('pointerup', (e) => onPointerUp(i, e));
    btn.addEventListener('pointercancel', () => onPointerCancel(i));
    btn.addEventListener('pointerleave', () => onPointerLeave(i));
    btn.addEventListener('keydown', (e) => onKeyDown(e, i));
    boardEl.appendChild(btn);
  }
}

function renderPiece(i, occupant) {
  const el = cellEl(i);
  el.innerHTML = occupant === CAT ? catPiece() : robotPiece();
  el.classList.add('filled');
  el.setAttribute('aria-label', cellLabel(i, occupant));
}

function renderTurn() {
  const avatar = $('#turn-avatar');
  const text = $('#turn-text');
  const turn = $('.turn');
  if (gameState.state !== 'playing' || !currentPlayer) {
    turn.hidden = true;
    $('#hint').disabled = true;
    return;
  }
  turn.hidden = false;
  const isComputerTurn = mode === 'computer' && currentPlayer === DOG;
  if (isComputerTurn) {
    avatar.className = 'avatar thinking';
    avatar.innerHTML = robotPiece();
    text.textContent = '机器人在想……';
  } else {
    avatar.className = 'avatar';
    avatar.innerHTML = currentPlayer === CAT ? catPiece() : robotPiece();
    text.textContent = currentPlayer === CAT ? '轮到小猫啦' : '轮到机器人啦';
  }
  $('#hint').disabled = isComputerTurn;
}

// ---- 输入 ----
function canPlace(i) {
  if (locked) return false;
  if (gameState.state !== 'playing') return false;
  if (board[i]) return false;
  if (mode === 'computer' && currentPlayer !== CAT) return false;
  return true;
}

function nudge(i) {
  const el = cellEl(i);
  el.classList.remove('nudge');
  void el.offsetWidth;
  el.classList.add('nudge');
  schedule(() => el.classList.remove('nudge'), 260);
}

function onPointerDown(i, e) {
  if (!canPlace(i)) {
    if (board[i]) nudge(i);
    return;
  }
  pressIndex = i;
  pressCancelled = false;
  cellEl(i).classList.add('pressed');
  try { cellEl(i).setPointerCapture(e.pointerId); } catch {}
}

function onPointerLeave(i) {
  if (pressIndex === i) {
    pressCancelled = true;
    cellEl(i).classList.remove('pressed');
  }
}

function onPointerUp(i) {
  if (pressIndex !== i) return;
  cellEl(i).classList.remove('pressed');
  const cancelled = pressCancelled;
  pressIndex = -1;
  pressCancelled = false;
  if (!cancelled) commit(i, currentPlayer);
}

function onPointerCancel(i) {
  if (pressIndex === i) {
    cellEl(i).classList.remove('pressed');
    pressIndex = -1;
    pressCancelled = false;
  }
}

function onKeyDown(e, i) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  if (canPlace(i)) commit(i, currentPlayer);
  else if (board[i]) nudge(i);
}

// ---- 落子与回合 ----
function commit(i, player) {
  board[i] = player;
  renderPiece(i, player);
  const el = cellEl(i);
  void el.offsetWidth;
  el.classList.add('drop');
  schedule(() => el.classList.remove('drop'), 260);
  sounds.play('place');

  locked = true;
  const s = game.status(board);
  if (s.state !== 'playing') {
    currentPlayer = null;
    renderTurn();
    schedule(() => { locked = false; endGame(s); }, 420);
  } else if (mode === 'computer' && player === CAT) {
    currentPlayer = DOG;
    renderTurn();
    scheduleComputerMove();
  } else if (mode === 'computer' && player === DOG) {
    currentPlayer = CAT;
    renderTurn();
    schedule(() => { locked = false; }, 220);
  } else {
    currentPlayer = player === CAT ? DOG : CAT;
    renderTurn();
    schedule(() => { locked = false; }, 220);
  }
}

function scheduleComputerMove() {
  const delay = 600 + Math.random() * 300;
  schedule(() => {
    const i = game.computerMove(board, DOG, DIFFICULTIES[difficulty].ai);
    if (i >= 0 && gameState.state === 'playing') commit(i, DOG);
  }, delay);
}

// ---- 结束 ----
function resultText(s) {
  const n = CN_NUM[game.winLength] || String(game.winLength);
  if (s.state === 'draw') return '棋盘满啦，这次平手！';
  if (mode === 'computer') {
    return s.player === CAT ? `${n}个连起来啦！` : `机器人连成${n}个啦，再试一次吧！`;
  }
  return s.player === CAT ? '小猫赢啦！' : '机器人赢啦！';
}

function playEndSound(s) {
  if (s.state === 'draw') sounds.play('draw');
  else if (mode === 'computer' && s.player === DOG) sounds.play('lose');
  else sounds.play('win');
}

function endGame(s) {
  gameState = s;
  renderTurn();
  playEndSound(s);
  if (s.state === 'won') {
    celebrate(s.line);
    schedule(() => showResult(s), reducedMotion ? 150 : 780);
  } else {
    schedule(() => showResult(s), reducedMotion ? 150 : 420);
  }
}

function celebrate(line) {
  line.forEach((idx, n) => {
    const el = cellEl(idx);
    el.classList.add('win-cell');
    el.style.animationDelay = (n * 0.16) + 's';
  });
  schedule(() => drawLine($('#board'), $('.board-wrap'), $('#win-line'), line), 120);
  confetti();
}

function drawLine(boardEl, wrapEl, svgEl, line) {
  const wrapRect = wrapEl.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();
  const cells = boardEl.children;
  const centers = line.map((i) => {
    const r = cells[i].getBoundingClientRect();
    return { x: r.left + r.width / 2 - boardRect.left, y: r.top + r.height / 2 - boardRect.top };
  });
  const p0 = centers[0];
  const p1 = centers[centers.length - 1];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const ext = Math.min(boardRect.width, boardRect.height) * 0.07;
  const sx = p0.x - (dx / len) * ext;
  const sy = p0.y - (dy / len) * ext;
  const ex = p1.x + (dx / len) * ext;
  const ey = p1.y + (dy / len) * ext;

  svgEl.style.left = (boardRect.left - wrapRect.left) + 'px';
  svgEl.style.top = (boardRect.top - wrapRect.top) + 'px';
  svgEl.setAttribute('width', boardRect.width);
  svgEl.setAttribute('height', boardRect.height);
  svgEl.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
  svgEl.innerHTML = `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"/>`;

  const path = svgEl.querySelector('line');
  const total = Math.hypot(ex - sx, ey - sy);
  if (reducedMotion) return;
  path.style.strokeDasharray = total;
  path.style.strokeDashoffset = total;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    path.style.transition = 'stroke-dashoffset 0.55s ease-out';
    path.style.strokeDashoffset = '0';
  }));
}

function confetti() {
  if (reducedMotion) return;
  const el = $('#confetti');
  el.innerHTML = '';
  const colors = ['#f6a75c', '#7ea8cf', '#8fb98a', '#f2c14e', '#e8894f'];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    const size = 8 + Math.random() * 10;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = (20 + Math.random() * 60) + '%';
    star.style.top = (-5 + Math.random() * 10) + '%';
    star.style.background = colors[i % colors.length];
    star.style.animationDelay = (Math.random() * 0.3) + 's';
    star.style.animationDuration = (0.9 + Math.random() * 0.5) + 's';
    el.appendChild(star);
  }
  schedule(() => { el.innerHTML = ''; }, 1600);
}

function showResult(s) {
  $('#result-text').textContent = resultText(s);
  $('#result').hidden = false;
  $('#hint').hidden = true;
}

function clearOverlays() {
  $('#win-line').innerHTML = '';
  $('#confetti').innerHTML = '';
  if (hintHaloEl) {
    hintHaloEl.classList.remove('hint-halo');
    hintHaloEl = null;
  }
}

// ---- 提示 ----
function showHint() {
  if (gameState.state !== 'playing') return;
  if (mode === 'computer' && currentPlayer !== CAT) return;
  const i = game.hint(board, currentPlayer);
  if (i < 0) return;
  if (hintHaloEl) hintHaloEl.classList.remove('hint-halo');
  hintHaloEl = cellEl(i);
  hintHaloEl.classList.add('hint-halo');
  schedule(() => {
    if (hintHaloEl) { hintHaloEl.classList.remove('hint-halo'); hintHaloEl = null; }
  }, 1600);
}

// ---- 流程 ----
function startGame(m) {
  mode = m;
  const preset = DIFFICULTIES[difficulty];
  game = createGame(preset.size, preset.winLength);
  board = Array(game.cells).fill(null);
  if (mode === 'computer') {
    currentPlayer = CAT;
  } else {
    currentPlayer = familyStarter;
    familyStarter = familyStarter === CAT ? DOG : CAT;
  }
  gameState = { state: 'playing' };
  locked = false;
  clearTimers();
  clearOverlays();
  renderBoard();
  renderTurn();
  $('#result').hidden = true;
  $('#hint').hidden = false;
  showScreen('game');
  sounds.unlock();
}

function goHome() {
  clearTimers();
  locked = false;
  board = Array(game.cells).fill(null);
  gameState = { state: 'playing' };
  clearOverlays();
  showScreen('home');
}

function beginOrTutorial(m) {
  sounds.unlock();
  pendingStartMode = m;
  if (tutorialDone) startGame(m);
  else showTutorial();
}

// ---- 教学 ----
function showTutorial() {
  const preset = DIFFICULTIES[difficulty];
  game = createGame(preset.size, preset.winLength);
  const dialog = $('#tutorial');
  $('#tutorial-message').textContent = '点一下空格，连成一条线';
  $('#tutorial-start').hidden = true;
  $('#tutorial-skip').hidden = false;
  $('#tutorial-line').innerHTML = '';
  renderTutorialBoard();
  dialog.showModal();
}

function tutorialLayout() {
  const placed = [];
  const line = [];
  for (let c = 0; c < game.winLength; c++) {
    line.push(c);
    if (c < game.winLength - 1) placed.push(c);
  }
  return { placed, target: game.winLength - 1, line };
}

function renderTutorialBoard() {
  const boardEl = $('#tutorial-board');
  boardEl.style.gridTemplateColumns = `repeat(${game.size}, 1fr)`;
  boardEl.dataset.size = game.size;
  const { placed, target, line } = tutorialLayout();
  boardEl.innerHTML = '';
  for (let i = 0; i < game.cells; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = i;
    if (placed.includes(i)) {
      cell.innerHTML = catPiece();
      cell.classList.add('filled');
      cell.setAttribute('aria-label', cellLabel(i, CAT));
    } else {
      cell.setAttribute('aria-label', cellLabel(i, null));
      if (i === target) cell.classList.add('hint-halo');
    }
    cell.addEventListener('click', () => onTutorialTap(i, cell, target, line));
    boardEl.appendChild(cell);
  }
}

function onTutorialTap(i, cell, target, line) {
  if (i !== target) return;
  cell.innerHTML = catPiece();
  cell.classList.remove('hint-halo');
  cell.classList.add('filled', 'drop');
  sounds.play('place');
  $('#tutorial-message').textContent = '连成一条线啦！';
  line.forEach((idx, n) => {
    const c = $('#tutorial-board').children[idx];
    c.classList.add('win-cell');
    c.style.animationDelay = (n * 0.16) + 's';
  });
  drawLine($('#tutorial-board'), $('.tutorial-board-wrap'), $('#tutorial-line'), line);
  schedule(() => {
    $('#tutorial-start').hidden = false;
    $('#tutorial-skip').hidden = true;
  }, reducedMotion ? 100 : 600);
}

function closeTutorialAndFinish() {
  finishingTutorial = true;
  $('#tutorial').close();
  finishTutorial();
}

function finishTutorial() {
  tutorialDone = true;
  storage.setItem('tictactoe-tutorial-done', '1');
  if (pendingStartMode) {
    const m = pendingStartMode;
    pendingStartMode = null;
    startGame(m);
  } else {
    goHome();
  }
}

// ---- 设置 ----
function openSettings() {
  document.querySelectorAll('input[name="difficulty"]').forEach((r) => {
    r.checked = r.value === difficulty;
  });
  $('#settings').showModal();
}

// ---- 事件绑定 ----
$('#hero-cat').innerHTML = catPiece();
$('#hero-robot').innerHTML = robotPiece();

$('#play-computer').addEventListener('click', () => beginOrTutorial('computer'));
$('#play-family').addEventListener('click', () => beginOrTutorial('family'));
$('#open-settings').addEventListener('click', openSettings);
$('#close-settings').addEventListener('click', () => {
  storage.setItem('tictactoe-difficulty', difficulty);
  $('#settings').close();
});
$('#replay-tutorial').addEventListener('click', () => {
  $('#settings').close();
  pendingStartMode = null;
  showTutorial();
});

document.querySelectorAll('input[name="difficulty"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) difficulty = input.value;
  });
});

$('#back').addEventListener('click', () => {
  const inProgress = gameState.state === 'playing' && board.some(Boolean);
  if (inProgress) $('#leave-confirm').showModal();
  else goHome();
});
$('#leave-stay').addEventListener('click', () => $('#leave-confirm').close());
$('#leave-go').addEventListener('click', () => { $('#leave-confirm').close(); goHome(); });

$('#play-again').addEventListener('click', () => startGame(mode));
$('#go-home').addEventListener('click', () => goHome());
$('#hint').addEventListener('click', showHint);

const soundBtn = $('#sound-toggle');
function syncSoundBtn() {
  const on = sounds.enabled;
  soundBtn.textContent = on ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', on ? '关闭音效' : '打开音效');
}
soundBtn.addEventListener('click', () => { sounds.toggle(); syncSoundBtn(); });
syncSoundBtn();

$('#tutorial-start').addEventListener('click', closeTutorialAndFinish);
$('#tutorial-skip').addEventListener('click', closeTutorialAndFinish);
$('#tutorial').addEventListener('close', () => {
  if (finishingTutorial) { finishingTutorial = false; return; }
  finishTutorial();
});

showScreen('home');
