import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleCreateRazorpayOrder, runVercelHandler } from '../../server/handlers.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await runVercelHandler(req, res, 'POST', handleCreateRazorpayOrder);
}
