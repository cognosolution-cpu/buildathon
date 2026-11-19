import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handleAgoraStart,
  handleAgoraStop,
  handleAgoraToken,
  handleCreateRazorpayOrder,
  handleHealth,
  handleMurfTts,
  handleNlu,
  handleVerifyRazorpay,
} from './server/handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const result = handleHealth();
    res.status(result.status).json(result.data);
  });

  app.post('/api/agora/token', (req: Request, res: Response) => {
    const result = handleAgoraToken(req.body ?? {});
    res.status(result.status).json(result.data);
  });

  app.post('/api/agora/start', async (req: Request, res: Response) => {
    const result = await handleAgoraStart(req.body ?? {});
    res.status(result.status).json(result.data);
  });

  app.post('/api/agora/stop', async (req: Request, res: Response) => {
    const result = await handleAgoraStop(req.body ?? {});
    res.status(result.status).json(result.data);
  });

  app.post('/api/tts/murf', async (req: Request, res: Response) => {
    const result = await handleMurfTts(req.body ?? {});
    if (result.binary) {
      res.status(result.status).setHeader('Content-Type', result.contentType ?? 'audio/mpeg').send(result.binary);
      return;
    }
    res.status(result.status).json(result.data);
  });

  app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
    const result = await handleCreateRazorpayOrder(req.body ?? {});
    res.status(result.status).json(result.data);
  });

  app.post('/api/razorpay/verify', (req: Request, res: Response) => {
    const result = handleVerifyRazorpay(req.body ?? {});
    res.status(result.status).json(result.data);
  });

  app.post('/api/nlu', async (req: Request, res: Response) => {
    const result = await handleNlu(req.body ?? {});
    res.status(result.status).json(result.data);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VibeCart server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VibeCart server:', err);
  process.exit(1);
});
