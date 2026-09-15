import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuditLoggerService } from '../services/audit-logger.service';

const createTicketSchema = z.object({
  shipmentId: z.string().uuid(),
  assignedRole: z.string(),
  title: z.string().min(5),
  category: z.enum([
    'VALUATION_DISPUTE',
    'CUSTOMS_HOLD',
    'DOCUMENT_DEFICIENCY',
    'PORT_DELAY',
    'INSPECTION_FAIL',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  message: z.string().min(1),
});

const messageSchema = z.object({
  message: z.string().min(1),
});

export const ticketRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/tickets - List dispute tickets
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const query = request.query as {
      shipmentId?: string;
      status?: string;
      assignedRole?: string;
    };

    const where: any = {};
    if (query.shipmentId) where.shipmentId = query.shipmentId;
    if (query.status) where.status = query.status;
    if (query.assignedRole) where.assignedRole = query.assignedRole;

    // Importer only sees tickets they created or on their shipments
    if (request.user.role === 'IMPORTER_SUPPLIER') {
      where.OR = [{ creatorId: request.user.id }, { shipment: { importerId: request.user.id } }];
    }

    const tickets = await fastify.prisma.ticket.findMany({
      where,
      include: {
        creator: { select: { id: true, fullName: true, role: true, organization: true } },
        messages: {
          include: {
            sender: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        shipment: {
          select: { id: true, trackingNumber: true, title: true, currentStage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.status(200).send({ tickets, total: tickets.length });
  });

  // POST /api/tickets - Open dispute ticket
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = createTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const { shipmentId, assignedRole, title, category, priority, message } = parsed.data;

    const count = await fastify.prisma.ticket.count();
    const ticketNumber = `DISP-2026-${String(count + 1).padStart(4, '0')}`;

    const ticket = await fastify.prisma.ticket.create({
      data: {
        ticketNumber,
        shipmentId,
        creatorId: request.user.id,
        assignedRole,
        title,
        category,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            senderId: request.user.id,
            message,
          },
        },
      },
      include: {
        messages: true,
        creator: { select: { id: true, fullName: true, role: true } },
      },
    });

    await AuditLoggerService.recordLog(fastify.prisma, {
      shipmentId,
      actorId: request.user.id,
      actorRole: request.user.role,
      actorName: request.user.fullName,
      action: 'TICKET_CREATED',
      details: `Dispute ticket ${ticketNumber} (${category}) opened and assigned to ${assignedRole}.`,
      newStateJson: { ticketNumber, title, category },
    });

    return reply.status(201).send({ ticket });
  });

  // POST /api/tickets/:id/messages - Post message to dispute thread
  fastify.post('/:id/messages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = messageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const ticket = await fastify.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return reply.status(404).send({ error: 'Not Found', message: 'Ticket not found' });
    }

    const message = await fastify.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: request.user.id,
        message: parsed.data.message,
      },
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
      },
    });

    return reply.status(201).send({ message });
  });

  // PATCH /api/tickets/:id/status - Update ticket status
  fastify.patch('/:id/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' };

    if (!['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].includes(body.status)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid status' });
    }

    const updated = await fastify.prisma.ticket.update({
      where: { id },
      data: { status: body.status },
    });

    return reply.status(200).send({ ticket: updated });
  });
};
