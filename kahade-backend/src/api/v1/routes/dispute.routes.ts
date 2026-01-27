import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'dispute' });
});

router.post('/', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/disputes' });
});

router.get('/', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/disputes' });
});

router.get('/:id', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/disputes/:id' });
});

router.post('/:id/respond', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/disputes/:id/respond' });
});

export default router;
