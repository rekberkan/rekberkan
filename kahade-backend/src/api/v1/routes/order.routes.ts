import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'order' });
});

// Create order
router.post('/', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/orders' });
});

// Get orders
router.get('/', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/orders' });
});

// Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/orders/:id' });
});

// Accept order
router.post('/accept', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/orders/accept' });
});

// Pay order
router.post('/:id/pay', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/orders/:id/pay' });
});

// Confirm delivery
router.post('/:id/confirm-delivery', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/orders/:id/confirm-delivery' });
});

export default router;
