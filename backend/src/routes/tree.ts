import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get full infrastructure tree
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        vms: {
          include: {
            disks: {
              orderBy: { name: 'asc' },
            },
            ips: {
              orderBy: { address: 'asc' },
            },
            networkConnections: true,
          },
          orderBy: { name: 'asc' },
        },
        ips: {
          orderBy: { address: 'asc' },
        },
        networkConnections: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get all network connections for workspace visualization
    const networkConnections = await prisma.networkConnection.findMany({
      select: {
        id: true,
        name: true,
        bandwidth: true,
        color: true,
        serverId: true,
        vmId: true,
      },
    }).catch(() => []);  // Fallback if color column doesn't exist yet

    // Calculate summary stats
    const stats = {
      totalServers: servers.length,
      totalVMs: servers.reduce((acc, s) => acc + s.vms.length, 0),
      totalDisks: servers.reduce(
        (acc, s) => acc + s.vms.reduce((vacc, v) => vacc + v.disks.length, 0),
        0
      ),
      totalIPs: await prisma.iPAddress.count(),
      freeIPs: await prisma.iPAddress.count({ where: { status: 'FREE' } }),
      inUseIPs: await prisma.iPAddress.count({ where: { status: 'IN_USE' } }),
      reservedIPs: await prisma.iPAddress.count({ where: { status: 'RESERVED' } }),
      totalStorage: servers.reduce(
        (acc, s) =>
          acc + s.vms.reduce((vacc, v) => vacc + v.disks.reduce((dacc, d) => dacc + d.size, 0), 0),
        0
      ),
      totalBandwidth: await prisma.networkConnection.aggregate({
        _sum: { bandwidth: true },
      }),
    };

    res.json({
      success: true,
      data: {
        tree: servers,
        networkConnections,
        stats: {
          ...stats,
          totalBandwidth: stats.totalBandwidth._sum.bandwidth || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch infrastructure tree' });
  }
});

export default router;
