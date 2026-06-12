import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.catalystUser });
});

export default router;
