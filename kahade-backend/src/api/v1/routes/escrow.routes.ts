import { Router } from 'express';

const router: import("express").Router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default router;
