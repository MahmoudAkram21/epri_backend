import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret, {}) as any;
    
    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, is_verified: true }
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (!user.is_verified) {
      res.status(401).json({ message: 'Account not verified' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
};

export const requireInstructor = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!['ADMIN', 'INSTRUCTOR'].includes(req.user.role)) {
    res.status(403).json({ message: 'Instructor access required' });
    return;
  }

  next();
};

export const requireVerifiedUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!['STUDENT', 'RESEARCHER', 'INSTRUCTOR', 'ADMIN'].includes(req.user.role)) {
    res.status(403).json({ message: 'Verified user access required' });
    return;
  }

  next();
};
