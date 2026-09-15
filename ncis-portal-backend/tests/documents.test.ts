import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Document Management REST API', () => {
  let app: FastifyInstance;
  let importerToken: string;
  let shipmentId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const impLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'importer@ethioimport.com', password: 'Demo@2026!', demoBypass: true },
    });
    importerToken = JSON.parse(impLogin.payload).token;

    const ship = await app.prisma.shipment.findFirst();
    shipmentId = ship!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/documents - should attach a document to a shipment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/documents',
      headers: { Authorization: `Bearer ${importerToken}` },
      payload: {
        shipmentId,
        type: 'INSURANCE_CERTIFICATE',
        fileName: 'Ethiopian_Insurance_Policy_2026.pdf',
        filePath: '/uploads/documents/Ethiopian_Insurance_Policy_2026.pdf',
        version: 1,
        signedBy: 'Ethiopian Insurance Corporation',
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.payload);
    expect(data.document).toHaveProperty('id');
    expect(data.document.type).toBe('INSURANCE_CERTIFICATE');
    expect(data.document.status).toBe('VERIFIED');
  });

  it('GET /api/documents/shipment/:shipmentId - should list documents for shipment', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/documents/shipment/${shipmentId}`,
      headers: { Authorization: `Bearer ${importerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.documents.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/documents/:id/sign - should digitally sign a document', async () => {
    const doc = await app.prisma.document.findFirst({
      where: { shipmentId },
    });
    expect(doc).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      url: `/api/documents/${doc!.id}/sign`,
      headers: { Authorization: `Bearer ${importerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.document.signedBy).toContain('Dawit Haile');
    expect(data.document.signedAt).toBeDefined();
  });
});
