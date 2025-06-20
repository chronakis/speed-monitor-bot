import { Router } from 'express';

const router = Router();

router.get('/profile', (_req, res) => {
  res.json({ message: 'User routes - TODO' });
});

export default router; 