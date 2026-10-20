import { mkdir, cp, rm } from 'node:fs/promises';
await rm('dist-candy', { recursive: true, force: true });
await mkdir('dist-candy', { recursive: true });
await cp('public/game/index.html', 'dist-candy/index.html');
await cp('public/game', 'dist-candy/game', { recursive: true });
console.log('Static site built in dist-candy/');
