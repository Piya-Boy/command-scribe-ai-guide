import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

export class SecurityMiddleware {
  static applyHelmet(app: any) {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: true,
      dnsPrefetchControl: true,
      frameguard: true,
      hidePoweredBy: true,
      hsts: true,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: true,
      referrerPolicy: true,
      xssFilter: true
    }));
  }

  static applyRateLimiting(app: any) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    });
    app.use(limiter);
  }

  static sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '');
  }

  static hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  static validateSession(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  static csrfProtection(req: Request, res: Response, next: NextFunction) {
    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken || csrfToken !== req.session?.csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
  }
} 