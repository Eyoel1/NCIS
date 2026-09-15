import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { EthiopianCustomsEngine } from '../services/customs-calculator.service';
import { FormC30PdfGenerator } from '../services/pdf-generator.service';
import { AuditLoggerService } from '../services/audit-logger.service';

const calculateSchema = z.object({
  cifValue: z.number().optional(),
  fobUsd: z.number().optional(),
  freightUsd: z.number().optional(),
  insuranceUsd: z.number().optional(),
  exchangeRate: z.number().optional(),
  vehicleCategory: z.string().optional(),
  engineCapacityCc: z.number().optional(),
  engineDisplacementCc: z.number().optional(),
  fuelType: z.string().optional(),
  grossVehicleWeightTonnes: z.number().optional(),
  productionYear: z.number().optional(),
  depreciationYears: z.number().optional(),
});

const declarationSchema = z.object({
  shipmentId: z.string().uuid(),
  declarantName: z.string().optional(),
  declarantTin: z.string().optional(),
  customsOffice: z.string().optional(),
  channel: z.enum(['GREEN', 'YELLOW', 'RED']).optional(),
  cifValue: z.number().optional(),
  engineCapacityCc: z.number().optional(),
  fuelType: z.string().optional(),
  vehicleCategory: z.string().optional(),
});

export const customsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/customs/calculate - Cascading tariff calculator
  fastify.post('/calculate', async (request, reply) => {
    const parsed = calculateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const input = parsed.data;
    try {
      const calculation = EthiopianCustomsEngine.calculate({
        cifValue: input.cifValue,
        fobUsd: input.fobUsd,
        freightUsd: input.freightUsd,
        insuranceUsd: input.insuranceUsd,
        exchangeRate: input.exchangeRate,
        vehicleCategory: input.vehicleCategory,
        engineDisplacementCc: input.engineDisplacementCc ?? input.engineCapacityCc,
        fuelType: input.fuelType,
        grossVehicleWeightTonnes: input.grossVehicleWeightTonnes,
        productionYear: input.productionYear,
        depreciationYears: input.depreciationYears,
      });

      return reply.status(200).send(calculation);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Calculation Error', message: err.message });
    }
  });

  // POST /api/customs/declarations - File customs declaration
  fastify.post(
    '/declarations',
    { preHandler: [fastify.requireRole(['SUPER_ADMIN', 'CUSTOMS_AUTHORITY', 'IMPORTER_SUPPLIER', 'TRANSPORT_FORWARDER'])] },
    async (request, reply) => {
      const parsed = declarationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
      }

      const { shipmentId, declarantName, declarantTin, customsOffice, channel } = parsed.data;

      const shipment = await fastify.prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: { vehicles: true, importer: true },
      });

      if (!shipment) {
        return reply.status(404).send({ error: 'Not Found', message: 'Shipment not found' });
      }

      const vehicle = shipment.vehicles[0];
      const cif = parsed.data.cifValue || vehicle?.cifValue || 2500000;
      const cc = parsed.data.engineCapacityCc ?? vehicle?.engineCc ?? 2000;
      const fuel = parsed.data.fuelType || vehicle?.fuelType || 'PETROL';
      const category = parsed.data.vehicleCategory || (fuel === 'ELECTRIC' ? 'ELECTRIC_VEHICLE' : 'PASSENGER_ICE');

      const calc = EthiopianCustomsEngine.calculate({
        cifValue: cif,
        engineDisplacementCc: cc,
        fuelType: fuel,
        vehicleCategory: category,
      });

      const count = await fastify.prisma.customsDeclaration.count();
      const declarationNumber = `ECC-DEC-2026-${String(count + 1).padStart(5, '0')}`;

      const declaration = await fastify.prisma.customsDeclaration.upsert({
        where: { shipmentId },
        update: {
          assessedCif: calc.cifEtb,
          dutyAmount: calc.dutyAmount,
          exciseAmount: calc.exciseAmount,
          vatAmount: calc.vatAmount,
          surtaxAmount: calc.surtaxAmount,
          withholdingAmount: calc.withholdingAmount,
          totalPayable: calc.totalPayable,
          declarantName: declarantName || request.user.fullName,
          declarantTin: declarantTin || '0048192031',
          customsOffice: customsOffice || 'Modjo Dry Port Customs Branch',
          channel: channel || 'YELLOW',
        },
        create: {
          shipmentId,
          declarationNumber,
          assessedCif: calc.cifEtb,
          dutyAmount: calc.dutyAmount,
          exciseAmount: calc.exciseAmount,
          vatAmount: calc.vatAmount,
          surtaxAmount: calc.surtaxAmount,
          withholdingAmount: calc.withholdingAmount,
          totalPayable: calc.totalPayable,
          paymentStatus: 'UNPAID',
          declarantName: declarantName || request.user.fullName,
          declarantTin: declarantTin || '0048192031',
          customsOffice: customsOffice || 'Modjo Dry Port Customs Branch',
          channel: channel || 'YELLOW',
        },
      });

      // Update shipment stage if in early stage
      if (['PRE_IMPORT', 'SHIPPING', 'PORT_OPERATIONS'].includes(shipment.currentStage)) {
        await fastify.prisma.shipment.update({
          where: { id: shipmentId },
          data: {
            currentStage: 'CUSTOMS',
            status: 'CUSTOMS_DECLARATION_FILED',
          },
        });
      }

      // Record audit log
      await AuditLoggerService.recordLog(fastify.prisma, {
        shipmentId,
        actorId: request.user.id,
        actorRole: request.user.role,
        actorName: request.user.fullName,
        action: 'CUSTOMS_DECLARATION_FILED',
        stage: 'CUSTOMS',
        details: `Customs Declaration ${declaration.declarationNumber} filed. Total tax payable: ETB ${calc.totalPayable.toLocaleString()}.`,
        newStateJson: { declarationNumber: declaration.declarationNumber, totalPayable: calc.totalPayable },
      });

      return reply.status(201).send({ declaration, calculation: calc });
    }
  );

  // GET /api/customs/declarations/:id/pdf - Generate Form C-30 PDF
  fastify.get('/declarations/:id/pdf', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Support query by declaration id OR declaration number OR shipmentId
    const declaration = await fastify.prisma.customsDeclaration.findFirst({
      where: {
        OR: [{ id }, { declarationNumber: id }, { shipmentId: id }],
      },
      include: {
        shipment: {
          include: {
            vehicles: true,
            importer: true,
          },
        },
      },
    });

    if (!declaration) {
      return reply.status(404).send({ error: 'Not Found', message: 'Declaration not found' });
    }

    const vehicle = declaration.shipment.vehicles[0];
    const calc = EthiopianCustomsEngine.calculate({
      cifValue: declaration.assessedCif,
      engineDisplacementCc: vehicle?.engineCc ?? 2000,
      fuelType: vehicle?.fuelType ?? 'PETROL',
      vehicleCategory: vehicle?.fuelType === 'ELECTRIC' ? 'ELECTRIC_VEHICLE' : 'PASSENGER_ICE',
    });

    const pdfBuffer = await FormC30PdfGenerator.generate({
      declarationNumber: declaration.declarationNumber,
      asycudaReference: `ASY-MODJO-2026-R-${declaration.declarationNumber.slice(-5)}`,
      assessmentDate: declaration.createdAt.toISOString().split('T')[0],
      customsStation: declaration.customsOffice || 'Modjo Dry Port Customs Branch',
      channel: declaration.channel || 'YELLOW',
      declarantName: declaration.declarantName || 'Trans-Ethiopia Freight Forwarding',
      declarantTin: declaration.declarantTin || '0048192031',
      importerName: declaration.shipment.importer?.fullName || 'Ethio-Red Sea Motors PLC',
      importerTin: '0019482716',
      supplierName: 'Toyota Tsusho Corporation ME',
      portOfLoading: declaration.shipment.originPort,
      vesselName: declaration.shipment.vesselName || 'M/V Shebelle',
      billOfLadingNumber: declaration.shipment.billOfLadingNumber || 'ESLSE-BL-2026-9042',
      containerNumber: declaration.shipment.containerNumber || 'ESLU-481920-3',
      vin: vehicle?.vin || 'JTEBU5JR8K5019821',
      make: vehicle?.make || 'Toyota',
      model: vehicle?.model || 'Hilux',
      year: vehicle?.year || 2025,
      engineCc: vehicle?.engineCc || 2393,
      fuelType: vehicle?.fuelType || 'DIESEL',
      color: vehicle?.color || 'Super White',
      cifUsd: calc.cifUsd,
      cifEtb: declaration.assessedCif,
      exchangeRate: calc.exchangeRateUsed,
      hsCode: calc.hsCode,
      dutyAmount: declaration.dutyAmount,
      dutyRatePercent: calc.dutyRate * 100,
      exciseAmount: declaration.exciseAmount,
      exciseRatePercent: calc.exciseRate * 100,
      vatAmount: declaration.vatAmount,
      vatRatePercent: calc.vatRate * 100,
      surtaxAmount: declaration.surtaxAmount,
      surtaxRatePercent: calc.surtaxRate * 100,
      withholdingAmount: declaration.withholdingAmount,
      withholdingRatePercent: calc.withholdingRate * 100,
      totalPayable: declaration.totalPayable,
      paymentStatus: declaration.paymentStatus,
      paymentReference: declaration.paymentReference || 'CBE-TX-9941829',
    });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${declaration.declarationNumber}.pdf"`);
    return reply.send(pdfBuffer);
  });

  // POST /api/customs/declarations/:id/pay - Settle customs duty payment
  fastify.post(
    '/declarations/:id/pay',
    { preHandler: [fastify.requireRole(['SUPER_ADMIN', 'CUSTOMS_AUTHORITY', 'FINANCIAL_INSURANCE'])] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = (request.body || {}) as { paymentReference?: string };

      const declaration = await fastify.prisma.customsDeclaration.findFirst({
        where: { OR: [{ id }, { declarationNumber: id }] },
      });

      if (!declaration) {
        return reply.status(404).send({ error: 'Not Found', message: 'Declaration not found' });
      }

      const paymentReference = body.paymentReference || `CBE-TX-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const updated = await fastify.prisma.customsDeclaration.update({
        where: { id: declaration.id },
        data: {
          paymentStatus: 'PAID',
          paymentReference,
          paymentDate: new Date(),
          clearedAt: new Date(),
        },
      });

      await fastify.prisma.shipment.update({
        where: { id: declaration.shipmentId },
        data: { status: 'DUTY_PAID' },
      });

      await AuditLoggerService.recordLog(fastify.prisma, {
        shipmentId: declaration.shipmentId,
        actorId: request.user.id,
        actorRole: request.user.role,
        actorName: request.user.fullName,
        action: 'DUTY_PAYMENT_SETTLED',
        stage: 'CUSTOMS',
        details: `Customs duty payment of ETB ${declaration.totalPayable.toLocaleString()} settled via CBE reference ${paymentReference}.`,
        newStateJson: { paymentStatus: 'PAID', paymentReference },
      });

      return reply.status(200).send({
        success: true,
        declaration: updated,
        message: 'Customs duties settled and cleared successfully.',
      });
    }
  );
};
