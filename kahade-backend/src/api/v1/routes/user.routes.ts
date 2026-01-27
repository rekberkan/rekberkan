import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'user' });
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/users/me' });
});

// Update profile
router.put('/me', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: PUT /api/v1/users/me' });
});

// Change password
router.post('/me/change-password', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: POST /api/v1/users/me/change-password' });
});

// Get user by ID (public profile)
router.get('/:id', async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Use NestJS endpoint: GET /api/v1/users/:id' });
});

export default router;
