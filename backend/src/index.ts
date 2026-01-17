import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import exportRoutes from './routes/export.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:1420', 'http://127.0.0.1:1420', 'tauri://localhost'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'MermGraph Backend API' });
});

// Export routes
app.route('/api', exportRoutes);

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

// Start server
const port = 3001;

serve({
  fetch: app.fetch,
  port,
}, () => {
  console.log(`MermGraph Backend running on http://localhost:${port}`);
});
