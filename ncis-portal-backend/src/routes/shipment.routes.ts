import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuditLoggerService } from '../services/audit-logger.service';

const createShipmentSchema = z.object({
  title: z.string().optional(),
  originPort: z.string(),
  transitPort: z.string().optional().default('Port of Djibouti'),
  destinationPort: z.string().default('Modjo Dry Port'),
  shippingLine: z.string().optional(),
  vesselName: z.string().optional(),
  containerNumber: z.string().optional(),
  billOfLadingNumber: z.string().optional(),
  notes: z.string().optional(),
  vehicles: z
    .array(
      z.object({
        vin: z.string().min(6),
        make: z.string(),
        model: z.string(),
        year: z.number().int(),
        engineCc: z.number().int(),
        fuelType: z.string(),
        cifValue: z.number().positive(),
        color: z.string().default('Standard'),
        fobPriceUsd: z.number().optional(),
        freightUsd: z.number().optional(),
        insuranceUsd: z.number().optional(),
      })
    )
    .min(1),
});

const updateStageSchema = z.object({
  stage: z.enum(['PRE_IMPORT', 'SHIPPING', 'PORT_OPERATIONS', 'CUSTOMS', 'POST_CUSTOMS', 'DELIVERY']),
  status: z.string().optional(),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  delayRiskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  notes: z.string().optional(),
});

export const shipmentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/shipments - List shipments with filtering
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const query = request.query as {
      stage?: string;
      status?: string;
      search?: string;
      importerId?: string;
    };

    const where: any = {};

    if (query.stage) {
      where.currentStage = query.stage;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (request.user.role === 'IMPORTER_SUPPLIER') {
      where.importerId = request.user.id;
    } else if (query.importerId) {
      where.importerId = query.importerId;
    }

    if (query.search) {
      where.OR = [
        { trackingNumber: { contains: query.search } },
        { billOfLadingNumber: { contains: query.search } },
        { containerNumber: { contains: query.search } },
        { vesselName: { contains: query.search } },
        { vehicles: { some: { vin: { contains: query.search } } } },
      ];
    }

    const shipments = await fastify.prisma.shipment.findMany({
      where,
      include: {
        vehicles: true,
        customsDeclaration: {
          select: {
            declarationNumber: true,
            totalPayable: true,
            paymentStatus: true,
            channel: true,
          },
        },
        importer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            organization: true,
          },
        },
        _count: {
          select: {
            documents: true,
            tickets: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.status(200).send({
      shipments,
      total: shipments.length,
    });
  });

  // GET /api/shipments/track/:trackingOrVin - PUBLIC tracking endpoint
  fastify.get('/track/:trackingOrVin', async (request, reply) => {
    const { trackingOrVin } = request.params as { trackingOrVin: string };
    const cleanParam = trackingOrVin.trim().toUpperCase();

    const shipment = await fastify.prisma.shipment.findFirst({
      where: {
        OR: [
          { trackingNumber: cleanParam },
          { billOfLadingNumber: cleanParam },
          { vehicles: { some: { vin: cleanParam } } },
        ],
      },
      include: {
        vehicles: true,
        customsDeclaration: true,
        auditLogs: {
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            action: true,
            stage: true,
            details: true,
            timestamp: true,
            actorRole: true,
          },
        },
      },
    });

    if (!shipment) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `No shipment found for tracking identifier or VIN: ${cleanParam}`,
      });
    }

    const stages = ['PRE_IMPORT', 'SHIPPING', 'PORT_OPERATIONS', 'CUSTOMS', 'POST_CUSTOMS', 'DELIVERY'];
    const currentStageIndex = stages.indexOf(shipment.currentStage);

    const milestones = stages.map((stage, idx) => {
      const isCompleted = idx < currentStageIndex;
      const isCurrent = idx === currentStageIndex;
      const matchingLog = shipment.auditLogs.find((l) => l.stage === stage);

      return {
        stage,
        completed: isCompleted,
        current: isCurrent,
        timestamp: matchingLog ? matchingLog.timestamp : null,
      };
    });

    return reply.status(200).send({
      trackingNumber: shipment.trackingNumber,
      title: shipment.title,
      currentStage: shipment.currentStage,
      status: shipment.status,
      originPort: shipment.originPort,
      transitPort: shipment.transitPort,
      destinationPort: shipment.destinationPort,
      shippingLine: shipment.shippingLine,
      vesselName: shipment.vesselName,
      containerNumber: shipment.containerNumber,
      billOfLadingNumber: shipment.billOfLadingNumber,
      currentLocation: {
        name: shipment.currentLocationName,
        latitude: shipment.currentLatitude,
        longitude: shipment.currentLongitude,
      },
      delayRiskRating: shipment.delayRiskRating,
      estimatedArrival: shipment.estimatedArrival,
      actualArrival: shipment.actualArrival,
      milestones,
      vehicles: shipment.vehicles.map((v) => ({
        vin: v.vin,
        make: v.make,
        model: v.model,
        year: v.year,
        fuelType: v.fuelType,
        color: v.color,
        registrationPlate: v.registrationPlate,
        qrCodePayload: v.qrCodePayload,
        registrationStatus: v.registrationStatus,
      })),
      customsStatus: shipment.customsDeclaration
        ? {
            declarationNumber: shipment.customsDeclaration.declarationNumber,
            paymentStatus: shipment.customsDeclaration.paymentStatus,
            channel: shipment.customsDeclaration.channel,
            totalPayable: shipment.customsDeclaration.totalPayable,
          }
        : null,
    });
  });

  // GET /api/shipments/:id - Complete shipment dossier
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const shipment = await fastify.prisma.shipment.findUnique({
      where: { id },
      include: {
        vehicles: true,
        documents: {
          include: {
            uploader: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        customsDeclaration: true,
        inspectionRecords: true,
        auditLogs: {
          orderBy: { timestamp: 'asc' },
        },
        tickets: {
          include: {
            creator: { select: { id: true, fullName: true, role: true } },
            messages: {
              include: {
                sender: { select: { id: true, fullName: true, role: true } },
              },
            },
          },
        },
        importer: {
          select: { id: true, fullName: true, email: true, organization: true, phone: true },
        },
      },
    });

    if (!shipment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Shipment not found' });
    }

    return reply.status(200).send({ shipment });
  });

  // POST /api/shipments - Create a new import shipment
  fastify.post(
    '/',
    { preHandler: [fastify.requireRole(['SUPER_ADMIN', 'IMPORTER_SUPPLIER'])] },
    async (request, reply) => {
      const parsed = createShipmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
      }

      const body = parsed.data;
      const count = await fastify.prisma.shipment.count();
      let trackingNumber = `ET-SHP-2026-${String(count + 1).padStart(3, '0')}`;
      const existing = await fastify.prisma.shipment.findUnique({ where: { trackingNumber } });
      if (existing) {
        trackingNumber = `ET-SHP-2026-${String(count + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      }

      let shipment;
      try {
        shipment = await fastify.prisma.shipment.create({
          data: {
            trackingNumber,
            title: body.title || `Import shipment ${trackingNumber}`,
            importerId: request.user.id,
            originPort: body.originPort,
            transitPort: body.transitPort || 'Port of Djibouti',
            destinationPort: body.destinationPort || 'Modjo Dry Port',
            shippingLine: body.shippingLine || 'ESLSE',
            vesselName: body.vesselName,
            containerNumber: body.containerNumber,
            billOfLadingNumber: body.billOfLadingNumber,
            currentStage: 'PRE_IMPORT',
            status: 'DRAFT',
            notes: body.notes,
            vehicles: {
              create: body.vehicles.map((v) => ({
                vin: v.vin.toUpperCase(),
                make: v.make,
                model: v.model,
                year: v.year,
                engineCc: v.engineCc,
                fuelType: v.fuelType.toUpperCase(),
                cifValue: v.cifValue,
                color: v.color || 'Standard',
                fobPriceUsd: v.fobPriceUsd || 0,
                freightUsd: v.freightUsd || 0,
                insuranceUsd: v.insuranceUsd || 0,
                qrCodePayload: `https://ncis.gov.et/track/${v.vin.toUpperCase()}`,
                registrationStatus: 'PENDING_IMPORT',
              })),
            },
          },
          include: {
            vehicles: true,
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A vehicle with this VIN already exists',
          });
        }
        throw err;
      }

      // Immutable Audit Log
      await AuditLoggerService.recordLog(fastify.prisma, {
        shipmentId: shipment.id,
        actorId: request.user.id,
        actorRole: request.user.role,
        actorName: request.user.fullName,
        action: 'SHIPMENT_CREATED',
        stage: 'PRE_IMPORT',
        details: `Shipment ${trackingNumber} created with ${body.vehicles.length} vehicle(s).`,
        newStateJson: { trackingNumber, stage: 'PRE_IMPORT', vehiclesCount: body.vehicles.length },
      });

      return reply.status(201).send({ shipment });
    }
  );

  // PATCH /api/shipments/:id/stage - Advance lifecycle stage
  fastify.patch('/:id/stage', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateStageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const shipment = await fastify.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Shipment not found' });
    }

    const { stage, status, locationName, latitude, longitude, delayRiskRating, notes } = parsed.data;

    // RBAC validation for stage advancement
    const role = request.user.role;
    if (role !== 'SUPER_ADMIN') {
      const allowedRoleMap: Record<string, string[]> = {
        SHIPPING: ['SHIPPING_COMPANY'],
        PORT_OPERATIONS: ['PORT_OPERATOR'],
        CUSTOMS: ['CUSTOMS_AUTHORITY'],
        POST_CUSTOMS: ['TRANSPORT_FORWARDER'],
        DELIVERY: ['VEHICLE_REGISTRATION'],
      };

      const requiredRoles = allowedRoleMap[stage];
      if (requiredRoles && !requiredRoles.includes(role)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: `Advancing to stage ${stage} requires role ${requiredRoles.join(' or ')}. Current role: ${role}`,
        });
      }
    }

    // State machine sequential transition validation
    const ALLOWED_STAGE_TRANSITIONS: Record<string, string[]> = {
      PRE_IMPORT: ['SHIPPING'],
      SHIPPING: ['PORT_OPERATIONS'],
      PORT_OPERATIONS: ['CUSTOMS'],
      CUSTOMS: ['POST_CUSTOMS'],
      POST_CUSTOMS: ['DELIVERY'],
      DELIVERY: [], // Terminal stage
    };

    const currentStage = shipment.currentStage;
    if (stage !== currentStage) {
      const allowed = ALLOWED_STAGE_TRANSITIONS[currentStage] || [];
      if (!allowed.includes(stage)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Illegal state transition: cannot jump directly from ${currentStage} to ${stage}. Allowed next stages: [${allowed.join(', ')}]`,
        });
      }
    }

    const previousState = {
      stage: shipment.currentStage,
      status: shipment.status,
      location: shipment.currentLocationName,
    };

    const updated = await fastify.prisma.shipment.update({
      where: { id },
      data: {
        currentStage: stage,
        status: status || shipment.status,
        currentLocationName: locationName || shipment.currentLocationName,
        currentLatitude: latitude !== undefined ? latitude : shipment.currentLatitude,
        currentLongitude: longitude !== undefined ? longitude : shipment.currentLongitude,
        delayRiskRating: delayRiskRating || shipment.delayRiskRating,
        notes: notes ? `${shipment.notes || ''}\n[${new Date().toISOString()}] ${notes}` : shipment.notes,
      },
    });

    // Hash-chained audit record
    await AuditLoggerService.recordLog(fastify.prisma, {
      shipmentId: id,
      actorId: request.user.id,
      actorRole: request.user.role,
      actorName: request.user.fullName,
      action: 'STAGE_UPDATED',
      stage,
      details: `Advanced stage from ${shipment.currentStage} to ${stage}. Status: ${status || shipment.status}`,
      previousStateJson: previousState,
      newStateJson: { stage, status: status || shipment.status, location: locationName },
    });

    return reply.status(200).send({ shipment: updated });
  });

  // PATCH /api/shipments/:id/location - Update GPS coordinates & location
  fastify.patch('/:id/location', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      locationName: string;
      latitude: number;
      longitude: number;
      delayRiskRating?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };

    const updated = await fastify.prisma.shipment.update({
      where: { id },
      data: {
        currentLocationName: body.locationName,
        currentLatitude: body.latitude,
        currentLongitude: body.longitude,
        delayRiskRating: body.delayRiskRating,
      },
    });

    return reply.status(200).send({ shipment: updated });
  });
};
