import { Request, Response, NextFunction } from 'express';
import catalyst from 'zcatalyst-sdk-node';

export interface AuthRequest extends Request {
  catalystUser?: Record<string, unknown>;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const catalystApp = catalyst.initialize(req as unknown as { [x: string]: unknown });
    const user = await catalystApp.userManagement().getCurrentUser();
    req.catalystUser = user as unknown as Record<string, unknown>;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
