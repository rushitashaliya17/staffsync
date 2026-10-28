import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './server/app.js';
import { runSeed } from './server/scripts/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  // 1. Seed sample database if uninitialized
  try {
    await runSeed(false);
  } catch (err) {
    console.error('Failed to run seed script:', err);
  }

  // 2. Initialize Express application
  const app = createApp();

  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StaffSync HRM server listening on port ${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting StaffSync server:', err);
  process.exit(1);
});
