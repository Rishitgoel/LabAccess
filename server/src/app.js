import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { databaseReady } from './config/database.js';

export function createApp({ isDatabaseReady = databaseReady, production = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'API is reachable, but the database is unavailable. Check the server configuration and MongoDB.' } });
    }
    return res.json({ data: { status: 'ready', database: 'connected' } });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.' } }));
  if (production) {
    const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
    if (!existsSync(`${clientDist}/index.html`)) throw new Error('Client build is missing. Run npm run build before production start.');
    app.use(express.static(clientDist));
    app.get('/{*path}', (_req, res) => res.sendFile(`${clientDist}/index.html`));
  }
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
  app.use((error, _req, res, _next) => {
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    const code = status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR';
    const message = status === 413 ? 'Request body is too large.' : status === 400 ? 'Request body must be valid JSON.' : 'An unexpected error occurred.';
    res.status(status).json({ error: { code, message } });
  });
  return app;
}
