import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

type Permission = 'create' | 'update' | 'delete' | 'read' | 'manage_users';

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ['create', 'update', 'delete', 'read', 'manage_users'],
  OPERATOR: ['create', 'update', 'read'],
  VIEWER: ['read'],
};

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userPermissions = rolePermissions[req.user.role];

    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`,
      });
      return;
    }

    next();
  };
}

export function canCreate(req: AuthRequest): boolean {
  return req.user ? rolePermissions[req.user.role].includes('create') : false;
}

export function canUpdate(req: AuthRequest): boolean {
  return req.user ? rolePermissions[req.user.role].includes('update') : false;
}

export function canDelete(req: AuthRequest): boolean {
  return req.user ? rolePermissions[req.user.role].includes('delete') : false;
}
