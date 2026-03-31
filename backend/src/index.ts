import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import vmRoutes from './routes/vms.js';
import diskRoutes from './routes/disks.js';
import ipRoutes from './routes/ips.js';
import networkRoutes from './routes/network.js';
import treeRoutes from './routes/tree.js';
import workspaceRoutes from './routes/workspace.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/vms', vmRoutes);
app.use('/api/disks', diskRoutes);
app.use('/api/ips', ipRoutes);
app.use('/api/network-connections', networkRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/workspace', workspaceRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});
