// Browser-only QA fixture, excluded from dist. Isolated saved progress.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const source=await readFile('public/game/candy/index.html','utf8');
const html=source.replace('<body>','<body data-storage-key="candy-qa-4x4">').replace('<script type="module" src="/game/candy/app.js"></script>',`<script type="module">
import { levels } from '/game/candy/levels.js';
levels.splice(0, levels.length, { id: 1, name: '4×4 布局测试', size: 4, stops: [], start: { index: 0, direction: 1 }, end: { index: 12, direction: 1 } });
await import('/game/candy/app.js');
</script>`);
await mkdir('tests/fixtures',{recursive:true});
await writeFile('tests/fixtures/candy-4x4.html',html);
console.log('QA only: http://localhost:5188/tests/fixtures/candy-4x4.html');
