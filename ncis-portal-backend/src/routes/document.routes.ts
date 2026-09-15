import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { OcrSimulatorEngine } from '../services/ocr-simulator.service';
import { AuditLoggerService } from '../services/audit-logger.service';

const ocrScanSchema = z.object({
  rawText: z.string().optional(),
  documentType: z.string().optional(),
  fileName: z.string().optional(),
  templateType: z.enum(['INVOICE', 'BOL']).optional(),
});

const createDocSchema = z.object({
  shipmentId: z.string().uuid(),
  type: z.enum([
    'COMMERCIAL_INVOICE',
    'BILL_OF_LADING',
    'CUSTOMS_DECLARATION',
    'INSURANCE_CERTIFICATE',
    'INSPECTION_REPORT',
    'BANK_LC',
    'PACKING_LIST',
  ]),
  fileName: z.string(),
  filePath: z.string().optional(),
  version: z.number().int().optional().default(1),
  ocrDataJson: z.string().optional(),
  signedBy: z.string().optional(),
});

export const documentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/documents/ocr-scan - Scan & extract document fields
  fastify.post('/ocr-scan', async (request, reply) => {
    const parsed = ocrScanSchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const result = OcrSimulatorEngine.scan(parsed.data);
    return reply.status(200).send(result);
  });

  // POST /api/documents - Upload/attach document
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = createDocSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const { shipmentId, type, fileName, filePath, version, ocrDataJson, signedBy } = parsed.data;

    const shipment = await fastify.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Shipment not found' });
    }

    const document = await fastify.prisma.document.create({
      data: {
        shipmentId,
        uploaderId: request.user.id,
        type,
        fileName,
        filePath: filePath || `/uploads/documents/${fileName}`,
        version: version || 1,
        ocrDataJson: ocrDataJson || null,
        signedBy: signedBy || null,
        signedAt: signedBy ? new Date() : null,
        status: 'VERIFIED',
      },
    });

    await AuditLoggerService.recordLog(fastify.prisma, {
      shipmentId,
      actorId: request.user.id,
      actorRole: request.user.role,
      actorName: request.user.fullName,
      action: 'DOCUMENT_UPLOADED',
      details: `Document ${fileName} (${type} v${version}) uploaded and verified.`,
      newStateJson: { documentId: document.id, fileName, type },
    });

    return reply.status(201).send({ document });
  });

  // GET /api/documents/:id - Get document details
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const document = await fastify.prisma.document.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, fullName: true, role: true, organization: true } },
      },
    });

    if (!document) {
      return reply.status(404).send({ error: 'Not Found', message: 'Document not found' });
    }

    return reply.status(200).send({ document });
  });

  // GET /api/documents/shipment/:shipmentId - List shipment documents
  fastify.get('/shipment/:shipmentId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { shipmentId } = request.params as { shipmentId: string };

    const documents = await fastify.prisma.document.findMany({
      where: { shipmentId },
      include: {
        uploader: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.status(200).send({ documents });
  });

  // POST /api/documents/:id/sign - Digitally sign a document
  fastify.post('/:id/sign', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const document = await fastify.prisma.document.findUnique({ where: { id } });
    if (!document) {
      return reply.status(404).send({ error: 'Not Found', message: 'Document not found' });
    }

    const updated = await fastify.prisma.document.update({
      where: { id },
      data: {
        signedBy: `${request.user.fullName} (${request.user.role})`,
        signedAt: new Date(),
        status: 'VERIFIED',
      },
    });

    await AuditLoggerService.recordLog(fastify.prisma, {
      shipmentId: document.shipmentId,
      actorId: request.user.id,
      actorRole: request.user.role,
      actorName: request.user.fullName,
      action: 'DOCUMENT_DIGITALLY_SIGNED',
      details: `Document ${document.fileName} digitally signed by ${request.user.fullName}.`,
    });

    return reply.status(200).send({ document: updated });
  });
};
