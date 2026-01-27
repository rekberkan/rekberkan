import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'notification' });
});

router.get('/', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/notifications' });
});

router.post('/:id/read', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/notifications/:id/read' });
});

router.post('/read-all', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/notifications/read-all' });
});

export default router;
