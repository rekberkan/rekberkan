import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bank' });
});

router.post('/accounts', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/bank/accounts' });
});

router.get('/accounts', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/bank/accounts' });
});

router.delete('/accounts/:id', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: DELETE /api/v1/bank/accounts/:id' });
});

router.get('/list', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/bank/list' });
});

export default router;
