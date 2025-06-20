import { Router } from 'express';

const router = Router();

router.get('/flow', (_req, res) => {
  res.json({ message: 'HERE API routes - TODO' });
});

export default router; 