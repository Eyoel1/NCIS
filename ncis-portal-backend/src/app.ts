import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { prismaPlugin } from './plugins/prisma';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth.routes';
import { shipmentRoutes } from './routes/shipment.routes';
import { customsRoutes } from './routes/customs.routes';
import { documentRoutes } from './routes/document.routes';
import { vehicleRoutes } from './routes/vehicle.routes';
import { externalRoutes } from './routes/external.routes';
import { auditRoutes } from './routes/audit.routes';
import { ticketRoutes } from './routes/ticket.routes';
import { publicRoutes } from './routes/public.routes';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: opts.logger ?? false,
    ...opts,
  });

  // 1. Core Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // 2. Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'ncis-portal-backend',
    timestamp: new Date().toISOString(),
  }));

  // 3. Register Domain Routes under /api
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(shipmentRoutes, { prefix: '/api/shipments' });
  await app.register(customsRoutes, { prefix: '/api/customs' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
  await app.register(externalRoutes, { prefix: '/api/external' });
  await app.register(auditRoutes, { prefix: '/api/audit-logs' });
  await app.register(ticketRoutes, { prefix: '/api/tickets' });
  await app.register(publicRoutes, { prefix: '/api/public' });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    });
  });

  return app;
}
