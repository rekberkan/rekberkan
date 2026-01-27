import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'admin' });
});

router.get('/dashboard', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/admin/dashboard' });
});

router.get('/users', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/admin/users' });
});

router.get('/orders', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/admin/orders' });
});

router.get('/disputes', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/admin/disputes' });
});

export default router;
