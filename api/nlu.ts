import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleNlu, runVercelHandler } from '../server/handlers.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await runVercelHandler(req, res, 'POST', handleNlu);
}
