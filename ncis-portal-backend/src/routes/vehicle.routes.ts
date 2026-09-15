import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuditLoggerService } from '../services/audit-logger.service';

const inspectSchema = z.object({
  chassisVerified: z.boolean().default(true),
  engineVerified: z.boolean().default(true),
  emissionsStandard: z.string().default('EURO_4'),
  roadworthyStatus: z.enum(['PASSED', 'FAILED', 'CONDITIONAL']).default('PASSED'),
  findings: z.string().optional(),
});

const allocatePlateSchema = z.object({
  plateNumber: z.string().optional(),
});

export const vehicleRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/vehicles - List all vehicles
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const vehicles = await fastify.prisma.vehicle.findMany({
      include: {
        shipment: {
          select: {
            id: true,
            trackingNumber: true,
            title: true,
            currentStage: true,
            status: true,
          },
        },
        inspections: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.status(200).send({ vehicles, total: vehicles.length });
  });

  // GET /api/vehicles/:vin - Get vehicle by VIN
  fastify.get('/:vin', async (request, reply) => {
    const { vin } = request.params as { vin: string };

    const vehicle = await fastify.prisma.vehicle.findFirst({
      where: { OR: [{ vin: vin.toUpperCase() }, { id: vin }] },
      include: {
        shipment: {
          include: {
            customsDeclaration: true,
            importer: { select: { id: true, fullName: true, organization: true } },
          },
        },
        inspections: {
          orderBy: { inspectionDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return reply.status(404).send({ error: 'Not Found', message: 'Vehicle not found' });
    }

    return reply.status(200).send({ vehicle });
  });

  // POST /api/vehicles/:id/inspect - Technical inspection
  fastify.post(
    '/:id/inspect',
    { preHandler: [fastify.requireRole(['SUPER_ADMIN', 'VEHICLE_REGISTRATION'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = inspectSchema.safeParse(request.body || {});
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
      }

      const vehicle = await fastify.prisma.vehicle.findUnique({
        where: { id },
        include: { shipment: true },
      });

      if (!vehicle) {
        return reply.status(404).send({ error: 'Not Found', message: 'Vehicle not found' });
      }

      const count = await fastify.prisma.inspectionRecord.count();
      const certificateNumber = `MOTL-INSP-2026-${String(count + 1).padStart(4, '0')}`;

      const inspection = await fastify.prisma.inspectionRecord.create({
        data: {
          shipmentId: vehicle.shipmentId,
          vehicleId: vehicle.id,
          inspectorId: request.user.id,
          inspectorName: request.user.fullName,
          inspectionType: 'ROADWORTHINESS',
          passed: parsed.data.roadworthyStatus === 'PASSED',
          findings: parsed.data.findings || 'All roadworthiness, braking and chassis tests passed.',
          certificateNumber,
          chassisVerified: parsed.data.chassisVerified,
          engineVerified: parsed.data.engineVerified,
          emissionsStandard: parsed.data.emissionsStandard,
          roadworthyStatus: parsed.data.roadworthyStatus,
        },
      });

      await fastify.prisma.vehicle.update({
        where: { id },
        data: { registrationStatus: 'INSPECTED' },
      });

      await AuditLoggerService.recordLog(fastify.prisma, {
        shipmentId: vehicle.shipmentId,
        actorId: request.user.id,
        actorRole: request.user.role,
        actorName: request.user.fullName,
        action: 'VEHICLE_INSPECTED',
        stage: 'DELIVERY',
        details: `Vehicle ${vehicle.vin} passed roadworthiness inspection (${certificateNumber}).`,
        newStateJson: { certificateNumber, status: 'PASSED' },
      });

      return reply.status(201).send({ inspection });
    }
  );

  // POST /api/vehicles/:id/allocate-plate - Allocate license plate
  fastify.post(
    '/:id/allocate-plate',
    { preHandler: [fastify.requireRole(['SUPER_ADMIN', 'VEHICLE_REGISTRATION'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = allocatePlateSchema.safeParse(request.body || {});
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
      }

      const vehicle = await fastify.prisma.vehicle.findUnique({
        where: { id },
        include: { shipment: true },
      });

      if (!vehicle) {
        return reply.status(404).send({ error: 'Not Found', message: 'Vehicle not found' });
      }

      const plateNumber =
        parsed.data.plateNumber || `ET-AA-3-${Math.floor(10000 + Math.random() * 90000)}`;

      const updated = await fastify.prisma.vehicle.update({
        where: { id },
        data: {
          registrationPlate: plateNumber,
          titleIssued: true,
          registrationStatus: 'PLATE_ALLOCATED',
        },
      });

      await fastify.prisma.shipment.update({
        where: { id: vehicle.shipmentId },
        data: {
          currentStage: 'DELIVERY',
          status: 'PLATE_ASSIGNED',
        },
      });

      await AuditLoggerService.recordLog(fastify.prisma, {
        shipmentId: vehicle.shipmentId,
        actorId: request.user.id,
        actorRole: request.user.role,
        actorName: request.user.fullName,
        action: 'LICENSE_PLATE_ALLOCATED',
        stage: 'DELIVERY',
        details: `Official plate ${plateNumber} allocated to vehicle ${vehicle.vin}. Title deed issued.`,
        newStateJson: { vin: vehicle.vin, plateNumber, titleIssued: true },
      });

      return reply.status(200).send({ vehicle: updated, plateNumber });
    }
  );

  // POST /api/vehicles - Register / create a vehicle
  fastify.post(
    '/',
    { preHandler: [fastify.requireRole(['SUPER_ADMIN', 'IMPORTER_SUPPLIER', 'VEHICLE_REGISTRATION'])] },
    async (request, reply) => {
      const createVehicleSchema = z.object({
        shipmentId: z.string(),
        vin: z.string().min(6),
        make: z.string(),
        model: z.string(),
        year: z.number().int(),
        engineCc: z.number().int(),
        fuelType: z.string(),
        cifValue: z.number().positive(),
        color: z.string().default('Standard'),
        fobPriceUsd: z.number().optional().default(0),
        freightUsd: z.number().optional().default(0),
        insuranceUsd: z.number().optional().default(0),
      });

      const parsed = createVehicleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
      }

      try {
        const vehicle = await fastify.prisma.vehicle.create({
          data: {
            ...parsed.data,
            vin: parsed.data.vin.toUpperCase(),
            fuelType: parsed.data.fuelType.toUpperCase(),
            qrCodePayload: `https://ncis.gov.et/track/${parsed.data.vin.toUpperCase()}`,
            registrationStatus: 'PENDING_IMPORT',
          },
        });
        return reply.status(201).send({ vehicle });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A vehicle with this VIN already exists',
          });
        }
        throw err;
      }
    }
  );
};
