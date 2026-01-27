import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'webhook' });
});

// Xendit webhook
router.post('/xendit', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /webhooks/xendit' });
});

// Midtrans webhook
router.post('/midtrans', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /webhooks/midtrans' });
});

export default router;
