import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, EmployeeModel, IUser, IEmployee } from '../models/index.js';

export const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'staffsync_super_secure_access_secret_key_2026';

export interface AuthRequest extends Request {
  user?: IUser;
  employee?: IEmployee | null;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact HR.' });
    }

    req.user = user;
    if (user.employeeId) {
      req.employee = EmployeeModel.findById(user.employeeId);
    } else {
      req.employee = EmployeeModel.findOne({ userId: user._id });
    }

    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function roleMiddleware(...allowedRoles: Array<'HR' | 'Manager' | 'Employee'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Role check case-insensitively
    const userRole = req.user.role.toLowerCase();
    const hasRole = allowedRoles.some(r => r.toLowerCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles.`
      });
    }

    next();
  };
}

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[StaffSync Error]', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
