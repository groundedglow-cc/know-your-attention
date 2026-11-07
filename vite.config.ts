import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-game-entries',
      // Files in `public/` are served as assets by Vite, but its dev server
      // does not resolve their directory URLs to `index.html`. Keep the game
      // URLs tidy while mapping them to their static game documents.
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (!req.url) return next();

          const url = new URL(req.url, 'http://vite.local');
          for (const game of ['candy', 'tictactoe', 'memory']) {
            if (url.pathname === `/game/${game}` || url.pathname === `/game/${game}/`) {
              req.url = `/game/${game}/index.html${url.search}`;
            }
          }
          next();
        });
      },
    },
  ],
  server: { port: 5173, host: true },
});
