import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAgoraStart, runVercelHandler } from '../../server/handlers';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await runVercelHandler(req, res, 'POST', handleAgoraStart);
}
