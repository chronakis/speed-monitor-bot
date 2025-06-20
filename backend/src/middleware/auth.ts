import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { createError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        emailConfirmed: boolean;
        fullName?: string;
        provider?: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No authorization token provided', 401);
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw createError('Invalid or expired token', 401);
    }

    // Check if email is confirmed for sensitive operations
    if (!user.email_confirmed_at) {
      throw createError('Email not verified. Please check your email and verify your account.', 403);
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email!,
      emailConfirmed: user.email_confirmed_at !== null,
      fullName: user.user_metadata?.full_name || '',
      provider: user.app_metadata?.provider || 'email'
    };

    next();
  } catch (error: any) {
    next(error);
  }
};

// Optional auth middleware - doesn't require authentication but adds user if available
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email!,
        emailConfirmed: user.email_confirmed_at !== null,
        fullName: user.user_metadata?.full_name || '',
        provider: user.app_metadata?.provider || 'email'
      };
    }

    next();
  } catch (error) {
    // Ignore auth errors in optional auth
    next();
  }
};

// Middleware to require email verification
export const requireEmailVerified = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  if (!req.user.emailConfirmed) {
    throw createError('Email verification required. Please check your email and verify your account.', 403);
  }

  next();
};