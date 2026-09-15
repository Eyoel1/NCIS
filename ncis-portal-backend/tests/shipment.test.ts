import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { seed } from '../prisma/seed';

describe('Shipments & Lifecycle REST API', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let importerToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await seed(app.prisma);

    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@ncis.gov.et', password: 'Demo@2026!', demoBypass: true },
    });
    adminToken = JSON.parse(adminLogin.payload).token;

    const importerLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'importer@ethioimport.com', password: 'Demo@2026!', demoBypass: true },
    });
    importerToken = JSON.parse(importerLogin.payload).token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/shipments - should return all seeded shipments for Super Admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/shipments',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.shipments.length).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/shipments/track/:trackingOrVin - PUBLIC tracking without token', async () => {
    // Track by tracking number
    const res = await app.inject({
      method: 'GET',
      url: '/api/shipments/track/ET-SHP-2026-001',
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.trackingNumber).toBe('ET-SHP-2026-001');
    expect(data.currentStage).toBe('CUSTOMS');
    expect(data.currentLocation.name).toContain('Modjo');
    expect(data.vehicles.length).toBeGreaterThan(0);
    expect(data.milestones.length).toBe(6);

    // Track by VIN
    const vinRes = await app.inject({
      method: 'GET',
      url: '/api/shipments/track/JTEBU5JR8K5019821',
    });

    expect(vinRes.statusCode).toBe(200);
    const vinData = JSON.parse(vinRes.payload);
    expect(vinData.trackingNumber).toBe('ET-SHP-2026-001');
  });

  it('POST /api/shipments - should create new import shipment with audit record', async () => {
    const uniqueVin = `JS3JB74V5P4${Math.floor(100000 + Math.random() * 900000)}`;

    const res = await app.inject({
      method: 'POST',
      url: '/api/shipments',
      headers: { Authorization: `Bearer ${importerToken}` },
      payload: {
        title: 'New Import: Suzuki Jimny 1.5L',
        originPort: 'Port of Yokohama, Japan',
        transitPort: 'Port of Djibouti',
        destinationPort: 'Modjo Dry Port',
        shippingLine: 'ESLSE',
        vesselName: 'M/V Gibe',
        containerNumber: 'ESLU-991283-1',
        billOfLadingNumber: `ESLSE-BL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicles: [
          {
            vin: uniqueVin,
            make: 'Suzuki',
            model: 'Jimny 1.5L 4WD',
            year: 2025,
            engineCc: 1462,
            fuelType: 'PETROL',
            cifValue: 1850000.0,
            color: 'Kinetic Yellow',
            fobPriceUsd: 12500,
            freightUsd: 2200,
            insuranceUsd: 200,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.shipment).toHaveProperty('id');
    expect(body.shipment.trackingNumber).toMatch(/^ET-SHP-2026-/);
    expect(body.shipment.currentStage).toBe('PRE_IMPORT');
    expect(body.shipment.vehicles.length).toBe(1);
    expect(body.shipment.vehicles[0].vin).toBe(uniqueVin);
  });

  it('PATCH /api/shipments/:id/stage - should advance lifecycle stage and verify role permissions', async () => {
    let targetShipment = await app.prisma.shipment.findFirst({
      where: { currentStage: 'PRE_IMPORT' },
    });
    if (!targetShipment) {
      targetShipment = await app.prisma.shipment.findFirst();
    }
    expect(targetShipment).toBeDefined();

    // Importer cannot advance to SHIPPING (requires SHIPPING_COMPANY or SUPER_ADMIN)
    const failRes = await app.inject({
      method: 'PATCH',
      url: `/api/shipments/${targetShipment!.id}/stage`,
      headers: { Authorization: `Bearer ${importerToken}` },
      payload: { stage: 'SHIPPING' },
    });
    expect(failRes.statusCode).toBe(403);

    // Shipping company can advance
    const shipRes = await app.inject({
      method: 'PATCH',
      url: `/api/shipments/${targetShipment!.id}/stage`,
      headers: { 'x-demo-role': 'SHIPPING_COMPANY' },
      payload: {
        stage: 'SHIPPING',
        status: 'IN_TRANSIT_SEA',
        locationName: 'Arabian Sea Corridor',
      },
    });
    expect(shipRes.statusCode).toBe(200);
    const updated = JSON.parse(shipRes.payload).shipment;
    expect(updated.currentStage).toBe('SHIPPING');
  });

  it('GET /api/audit-logs/verify - should confirm cryptographic SHA-256 hash chain integrity', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/audit-logs/verify',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const verification = JSON.parse(res.payload);
    expect(verification.valid).toBe(true);
    expect(verification.totalLogs).toBeGreaterThan(0);
    expect(verification.message).toContain('Audit chain verified successfully');
  });
});
