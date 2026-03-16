import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import User, { IUser } from '../models/User';
import { UserRole } from '../types/enums';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ message: 'Account suspended', reason: user.suspendReason });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
