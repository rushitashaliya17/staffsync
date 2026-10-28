import path from 'node:path';
import { fileURLToPath } from 'url';
import express from 'express';
import 'dotenv/config';
import { createApp } from './app.js';
import { runSeed } from './scripts/seed.js';

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

  if (isProd) {
    // Production mode: serve the client build alongside the API.
    const distPath = path.resolve(__dirname, '../client/dist');
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
