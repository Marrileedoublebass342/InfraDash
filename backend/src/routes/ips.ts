import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get all IPs
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, serverId, vmId } = req.query;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (serverId) where.serverId = serverId;
    if (vmId) where.vmId = vmId;

    const ips = await prisma.iPAddress.findMany({
      where,
      include: {
        server: { select: { id: true, name: true } },
        vm: { select: { id: true, name: true } },
      },
      orderBy: { address: 'asc' },
    });
    res.json({ success: true, data: ips });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch IPs' });
  }
});

// Get single IP
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ip = await prisma.iPAddress.findUnique({
      where: { id: req.params.id },
      include: {
        server: { select: { id: true, name: true } },
        vm: { select: { id: true, name: true } },
      },
    });

    if (!ip) {
      res.status(404).json({ success: false, error: 'IP not found' });
      return;
    }

    res.json({ success: true, data: ip });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch IP' });
  }
});

// Create IP
router.post(
  '/',
  authenticate,
  requirePermission('create'),
  [
    body('address').isIP(),
    body('type').isIn(['RESERVED', 'CLIENT', 'NODE']),
    body('status').isIn(['FREE', 'IN_USE', 'RESERVED']),
    body('serverId').optional().isUUID(),
    body('vmId').optional().isUUID(),
    body('comment').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { address, type, status, serverId, vmId, comment } = req.body;
      const ip = await prisma.iPAddress.create({
        data: { address, type, status, serverId, vmId, comment },
        include: {
          server: { select: { id: true, name: true } },
          vm: { select: { id: true, name: true } },
        },
      });
      res.status(201).json({ success: true, data: ip });
    } catch (error) {
      if (String(error).includes('Unique constraint')) {
        res.status(400).json({ success: false, error: 'IP address already exists' });
        return;
      }
      res.status(500).json({ success: false, error: 'Failed to create IP' });
    }
  }
);

// Update IP
router.put(
  '/:id',
  authenticate,
  requirePermission('update'),
  [
    body('address').optional().isIP(),
    body('type').optional().isIn(['RESERVED', 'CLIENT', 'NODE']),
    body('status').optional().isIn(['FREE', 'IN_USE', 'RESERVED']),
    body('serverId').optional({ values: 'null' }).isUUID(),
    body('vmId').optional({ values: 'null' }).isUUID(),
    body('comment').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { address, type, status, serverId, vmId, comment } = req.body;
      const ip = await prisma.iPAddress.update({
        where: { id: req.params.id },
        data: { address, type, status, serverId, vmId, comment },
        include: {
          server: { select: { id: true, name: true } },
          vm: { select: { id: true, name: true } },
        },
      });
      res.json({ success: true, data: ip });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to update IP' });
    }
  }
);

// Delete IP
router.delete(
  '/:id',
  authenticate,
  requirePermission('delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.iPAddress.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'IP deleted' });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to delete IP' });
    }
  }
);

export default router;
