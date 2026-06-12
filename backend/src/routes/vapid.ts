import { Router } from 'express';

const router = Router();

router.get('/vapid-public-key', (_req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    res.status(500).json({ error: 'VAPID_PUBLIC_KEY is not configured' });
    return;
  }
  res.json({ publicKey });
});

export default router;
