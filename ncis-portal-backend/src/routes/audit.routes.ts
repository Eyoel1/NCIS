import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuditLoggerService } from '../services/audit-logger.service';

export const auditRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/audit-logs - List audit logs
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const query = request.query as {
      shipmentId?: string;
      actorRole?: string;
      action?: string;
      limit?: string;
    };

    const where: any = {};
    if (query.shipmentId) where.shipmentId = query.shipmentId;
    if (query.actorRole) where.actorRole = query.actorRole;
    if (query.action) where.action = query.action;

    const take = query.limit ? parseInt(query.limit, 10) : 50;

    const logs = await fastify.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take,
      include: {
        actor: { select: { id: true, fullName: true, role: true, organization: true } },
      },
    });

    return reply.status(200).send({ logs, total: logs.length });
  });

  // GET /api/audit-logs/verify - Cryptographic hash-chain verification
  fastify.get('/verify', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const query = request.query as { shipmentId?: string };
    const verification = await AuditLoggerService.verifyChain(fastify.prisma, query.shipmentId);
    return reply.status(200).send(verification);
  });

  // GET /api/audit-logs/verify/:shipmentId - Verify chain for specific shipment
  fastify.get('/verify/:shipmentId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shipmentId } = request.params as { shipmentId: string };
    const verification = await AuditLoggerService.verifyChain(fastify.prisma, shipmentId);
    return reply.status(200).send(verification);
  });
};
