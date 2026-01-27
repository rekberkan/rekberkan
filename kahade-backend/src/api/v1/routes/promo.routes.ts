import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'promo' });
});

router.post('/apply', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/promo/apply' });
});

router.get('/available', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/promo/available' });
});

export default router;
