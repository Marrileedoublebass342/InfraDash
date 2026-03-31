import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { loginUser, getUserById, getAllUsers, createUser, updateUser, deleteUser } from '../services/auth.service.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

const router = Router();

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body;
      const user = await loginUser(email, password);

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        data: { user, token },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ success: false, error: message });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Get all users (Admin only)
router.get(
  '/users',
  authenticate,
  requireRole('ADMIN'),
  async (_req: AuthRequest, res: Response) => {
    try {
      const users = await getAllUsers();
      res.json({ success: true, data: users });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to get users' });
    }
  }
);

// Create user (Admin only)
router.post(
  '/users',
  authenticate,
  requireRole('ADMIN'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
    body('role').isIn(['ADMIN', 'OPERATOR', 'VIEWER']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { email, password, name, role } = req.body;
      const user = await createUser(email, password, name, role);

      logger.info(`User created by admin: ${email} with role ${role}`);

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// Update user (Admin only)
router.put(
  '/users/:id',
  authenticate,
  requireRole('ADMIN'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'OPERATOR', 'VIEWER']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { id } = req.params;
      const { name, email, role } = req.body;
      const user = await updateUser(id, { name, email, role });

      logger.info(`User updated: ${user.email}`);

      res.json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// Delete user (Admin only)
router.delete(
  '/users/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await deleteUser(id, req.user!.userId);

      logger.info(`User deleted: ${user.email}`);

      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(400).json({ success: false, error: message });
    }
  }
);

export default router;
