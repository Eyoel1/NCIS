import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Vehicle Registry & Inspection REST API', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let ftaToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@ncis.gov.et', password: 'Demo@2026!', demoBypass: true },
    });
    adminToken = JSON.parse(adminLogin.payload).token;

    const ftaLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'fta@motl.gov.et', password: 'Demo@2026!', demoBypass: true },
    });
    ftaToken = JSON.parse(ftaLogin.payload).token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/vehicles - should list all vehicles', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/vehicles',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.vehicles.length).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/vehicles/:vin - should retrieve vehicle card by VIN', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/vehicles/JTEBU5JR8K5019821',
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.vehicle.vin).toBe('JTEBU5JR8K5019821');
    expect(data.vehicle.make).toBe('Toyota');
    expect(data.vehicle.model).toContain('Hilux');
  });

  it('POST /api/vehicles/:id/inspect - should perform technical inspection', async () => {
    const vehicle = await app.prisma.vehicle.findFirst({
      where: { registrationStatus: 'PENDING_IMPORT' },
    });
    expect(vehicle).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      url: `/api/vehicles/${vehicle!.id}/inspect`,
      headers: { Authorization: `Bearer ${ftaToken}` },
      payload: {
        chassisVerified: true,
        engineVerified: true,
        emissionsStandard: 'EURO_4',
        roadworthyStatus: 'PASSED',
        findings: 'Chassis stamp, braking efficiency, and lighting verified compliant with MOTL standards.',
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.payload);
    expect(data.inspection.passed).toBe(true);
    expect(data.inspection.certificateNumber).toMatch(/^MOTL-INSP-2026-/);
  });

  it('POST /api/vehicles/:id/allocate-plate - should allocate license plate and title deed', async () => {
    const vehicle = await app.prisma.vehicle.findFirst({
      where: { registrationPlate: null },
    });
    expect(vehicle).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      url: `/api/vehicles/${vehicle!.id}/allocate-plate`,
      headers: { Authorization: `Bearer ${ftaToken}` },
      payload: {
        plateNumber: 'ET-AA-3-77419',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.plateNumber).toBe('ET-AA-3-77419');
    expect(data.vehicle.titleIssued).toBe(true);
    expect(data.vehicle.registrationStatus).toBe('PLATE_ALLOCATED');
  });
});
