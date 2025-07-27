import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      console.error('JWT authentication error:', err);
      return res.status(500).json({ error: 'Authentication error' });
    }

    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: info?.message || 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      console.error('Optional auth error:', err);
    }
    
    // Set user if authenticated, but don't fail if not
    req.user = user || null;
    next();
  })(req, res, next);
};