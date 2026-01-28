import { Router, Request, Response, NextFunction } from 'express';

/**
 * Auth Routes
 *
 * Note: In NestJS, these routes are typically handled by the AuthController.
 * This file provides Express-style routes for compatibility or standalone use.
 * The actual implementation should use NestJS controllers for full functionality.
 */

const router: Router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'auth' });
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  // Delegated to AuthController in NestJS
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/register',
    note: 'This Express route is for reference only',
  });
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/login',
    note: 'This Express route is for reference only',
  });
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/logout',
    note: 'This Express route is for reference only',
  });
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/refresh',
    note: 'This Express route is for reference only',
  });
});

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/forgot-password',
    note: 'This Express route is for reference only',
  });
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/reset-password',
    note: 'This Express route is for reference only',
  });
});

// Verify email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: GET /api/v1/auth/verify-email/:token',
    note: 'This Express route is for reference only',
  });
});

// Setup MFA
router.post('/mfa/setup', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/mfa/setup',
    note: 'This Express route is for reference only',
  });
});

// Verify MFA
router.post('/mfa/verify', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/mfa/verify',
    note: 'This Express route is for reference only',
  });
});

// Disable MFA
router.post('/mfa/disable', async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Use NestJS endpoint: POST /api/v1/auth/mfa/disable',
    note: 'This Express route is for reference only',
  });
});

export default router;
