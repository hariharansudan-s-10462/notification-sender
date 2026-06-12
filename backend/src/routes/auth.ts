import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.catalystUser });
});

router.get('/urls', (_req, res) => {
  const baseUrl = process.env.CATALYST_AUTH_BASE_URL ?? '';
  const projectId = process.env.CATALYST_PROJECT_ID ?? '';
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
  const redirect = encodeURIComponent(appUrl);

  res.json({
    loginUrl: `${baseUrl}/server/v1/project/${projectId}/auth/login?redirect=${redirect}`,
    signupUrl: `${baseUrl}/server/v1/project/${projectId}/auth/register?redirect=${redirect}`,
    logoutUrl: `${baseUrl}/server/v1/project/${projectId}/auth/logout?redirect=${encodeURIComponent(appUrl + '/login')}`,
  });
});

export default router;
