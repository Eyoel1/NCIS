import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { seed } from '../prisma/seed';
import { AuditLoggerService } from '../src/services/audit-logger.service';

describe('Challenger 1 (Iteration 2) — Empirical Edge Transitions & Conflict Hardening Suite', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let importerToken: string;
  let shippingToken: string;
  let portToken: string;
  let customsToken: string;
  let forwarderToken: string;
  let vehicleRegToken: string;
  let financeToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await seed(app.prisma);

    const getRoleToken = async (role: string) => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/demo-switch',
        payload: { role },
      });
      expect(res.statusCode).toBe(200);
      return JSON.parse(res.payload).token;
    };

    adminToken = await getRoleToken('SUPER_ADMIN');
    importerToken = await getRoleToken('IMPORTER_SUPPLIER');
    shippingToken = await getRoleToken('SHIPPING_COMPANY');
    portToken = await getRoleToken('PORT_OPERATOR');
    customsToken = await getRoleToken('CUSTOMS_AUTHORITY');
    forwarderToken = await getRoleToken('TRANSPORT_FORWARDER');
    vehicleRegToken = await getRoleToken('VEHICLE_REGISTRATION');
    financeToken = await getRoleToken('FINANCIAL_INSURANCE');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // 1. SIMULTANEOUS DUPLICATE VIN CONFLICT STRESS TESTING
  // =========================================================================
  describe('1. Simultaneous Duplicate VIN Conflict Stress Testing', () => {
    it('1.1 Parallel shipment submissions with identical VIN: exactly 1 succeeds (201), remaining return 409 Conflict without 500 crashes', async () => {
      const conflictVin = `ET-VIN-RACE-${Date.now()}`;
      const parallelRequests = 8;

      const results = await Promise.all(
        Array.from({ length: parallelRequests }).map((_, idx) =>
          app.inject({
            method: 'POST',
            url: '/api/shipments',
            headers: { Authorization: `Bearer ${importerToken}` },
            payload: {
              originPort: 'Jebel Ali, UAE',
              destinationPort: 'Modjo Dry Port',
              vehicles: [
                {
                  vin: conflictVin,
                  make: 'Toyota',
                  model: `Hilux Double Cab Parallel ${idx}`,
                  year: 2024,
                  engineCc: 2400,
                  fuelType: 'DIESEL',
                  cifValue: 32000,
                },
              ],
            },
          })
        )
      );

      const statusCodes = results.map((r) => r.statusCode);
      const successes = statusCodes.filter((s) => s === 201);
      const conflicts = statusCodes.filter((s) => s === 409);
      const serverErrors = statusCodes.filter((s) => s >= 500);

      // Exactly one succeeds, all others conflict, ZERO 500 server crashes
      expect(serverErrors.length).toBe(0);
      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(parallelRequests - 1);

      for (const res of results) {
        if (res.statusCode === 409) {
          const body = JSON.parse(res.payload);
          expect(body.error).toBe('Conflict');
          expect(body.message).toContain('A vehicle with this VIN already exists');
        }
      }

      // Verify that the database only has 1 vehicle with that VIN
      const count = await app.prisma.vehicle.count({
        where: { vin: conflictVin },
      });
      expect(count).toBe(1);
    });

    it('1.2 Parallel direct vehicle registrations (/api/vehicles) with identical VIN: exactly 1 succeeds (201), remainder return 409 Conflict', async () => {
      // Find an existing shipment to attach vehicles to
      const shipment = await app.prisma.shipment.findFirst();
      expect(shipment).toBeDefined();

      const directVin = `ET-VIN-DIRECT-${Date.now()}`;
      const parallelCalls = 6;

      const results = await Promise.all(
        Array.from({ length: parallelCalls }).map((_, idx) =>
          app.inject({
            method: 'POST',
            url: '/api/vehicles',
            headers: { Authorization: `Bearer ${adminToken}` },
            payload: {
              shipmentId: shipment!.id,
              vin: directVin,
              make: 'Hyundai',
              model: `Tucson Parallel ${idx}`,
              year: 2023,
              engineCc: 2000,
              fuelType: 'PETROL',
              cifValue: 28000,
            },
          })
        )
      );

      const statusCodes = results.map((r) => r.statusCode);
      const successes = statusCodes.filter((s) => s === 201);
      const conflicts = statusCodes.filter((s) => s === 409);
      const serverErrors = statusCodes.filter((s) => s >= 500);

      expect(serverErrors.length).toBe(0);
      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(parallelCalls - 1);

      for (const res of results) {
        if (res.statusCode === 409) {
          const body = JSON.parse(res.payload);
          expect(body.error).toBe('Conflict');
          expect(body.message).toContain('A vehicle with this VIN already exists');
        }
      }
    });

    it('1.3 Case-insensitivity in duplicate VIN rejection: lower-case submission collides with existing upper-case VIN', async () => {
      const baseVin = `ET-VIN-CASE-${Date.now()}`;

      // First create upper case
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/shipments',
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: {
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          vehicles: [
            {
              vin: baseVin.toUpperCase(),
              make: 'Isuzu',
              model: 'NPR Truck',
              year: 2024,
              engineCc: 4500,
              fuelType: 'DIESEL',
              cifValue: 40000,
            },
          ],
        },
      });
      expect(res1.statusCode).toBe(201);

      // Attempt to submit lower-case version of the same VIN
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/shipments',
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: {
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          vehicles: [
            {
              vin: baseVin.toLowerCase(),
              make: 'Isuzu',
              model: 'NPR Truck Duplicate',
              year: 2024,
              engineCc: 4500,
              fuelType: 'DIESEL',
              cifValue: 40000,
            },
          ],
        },
      });
      expect(res2.statusCode).toBe(409);
      const body = JSON.parse(res2.payload);
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('already exists');
    });

    it('1.4 Duplicate VIN in a multi-vehicle batch rejects entire creation atomically with 409 Conflict', async () => {
      // Find an existing VIN from seed
      const existingVehicle = await app.prisma.vehicle.findFirst();
      expect(existingVehicle).toBeDefined();

      const newVin = `ET-VIN-BRANDNEW-${Date.now()}`;

      const res = await app.inject({
        method: 'POST',
        url: '/api/shipments',
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: {
          originPort: 'Mombasa',
          destinationPort: 'Kality Dry Port',
          vehicles: [
            {
              vin: newVin,
              make: 'Toyota',
              model: 'Corolla',
              year: 2023,
              engineCc: 1800,
              fuelType: 'HYBRID',
              cifValue: 22000,
            },
            {
              vin: existingVehicle!.vin, // DUPLICATE!
              make: 'Toyota',
              model: 'Existing Clone',
              year: 2023,
              engineCc: 1800,
              fuelType: 'HYBRID',
              cifValue: 22000,
            },
          ],
        },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.payload);
      expect(body.error).toBe('Conflict');

      // The new VIN should NOT have been created (atomicity)
      const brandNewRecord = await app.prisma.vehicle.findUnique({
        where: { vin: newVin },
      });
      expect(brandNewRecord).toBeNull();
    });
  });

  // =========================================================================
  // 2. STAGE PROGRESSION EDGE TRANSITIONS & BOUNDARY STRESS
  // =========================================================================
  describe('2. Stage Progression Edge Transitions & Boundary Stress', () => {
    let testShipmentId: string;

    beforeAll(async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const shp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-EDGE-${Date.now()}`,
          originPort: 'Port of Antwerp',
          transitPort: 'Port of Djibouti',
          destinationPort: 'Modjo Dry Port',
          currentStage: 'PRE_IMPORT',
          status: 'INITIATED',
          importerId: importer!.id,
          vehicles: {
            create: [
              {
                vin: `ET-VIN-EDGE-${Date.now()}`,
                make: 'Suzuki',
                model: 'Dzire',
                year: 2023,
                engineCc: 1200,
                fuelType: 'PETROL',
                cifValue: 14000,
                color: 'White',
                qrCodePayload: 'https://ncis.gov.et/track/test',
              },
            ],
          },
        },
      });
      testShipmentId = shp.id;
    });

    it('2.1 Edge Transition: Same-stage update with metadata mutation succeeds (200) without illegal transition error', async () => {
      // PRE_IMPORT -> PRE_IMPORT with updated location, notes, and delayRiskRating
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          stage: 'PRE_IMPORT',
          status: 'DOCUMENT_VERIFICATION',
          locationName: 'Addis Ababa Logistics Hub',
          latitude: 9.0107,
          longitude: 38.7612,
          delayRiskRating: 'MEDIUM',
          notes: 'Commercial invoice undergoing valuation audit',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.shipment.currentStage).toBe('PRE_IMPORT');
      expect(body.shipment.status).toBe('DOCUMENT_VERIFICATION');
      expect(body.shipment.currentLocationName).toBe('Addis Ababa Logistics Hub');
      expect(body.shipment.delayRiskRating).toBe('MEDIUM');
      expect(body.shipment.notes).toContain('Commercial invoice undergoing valuation audit');
    });

    it('2.2 Malformed Body: Empty payload or missing stage throws 400 Bad Request', async () => {
      const res1 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {},
      });
      expect(res1.statusCode).toBe(400);
      expect(JSON.parse(res1.payload).error).toBe('Bad Request');

      const res2 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { notes: 'Only notes without stage' },
      });
      expect(res2.statusCode).toBe(400);
    });

    it('2.3 Malformed Body: Invalid stage enum string throws 400 Bad Request', async () => {
      const badStages = ['INVALID_STAGE', 'WARP_SPEED', '123', 'pre_import', 'CUSTOMS_CLEARANCE'];
      for (const badStage of badStages) {
        const res = await app.inject({
          method: 'PATCH',
          url: `/api/shipments/${testShipmentId}/stage`,
          headers: { Authorization: `Bearer ${adminToken}` },
          payload: { stage: badStage },
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.payload).error).toBe('Bad Request');
      }
    });

    it('2.4 Malformed Body: Invalid field types in stage update throw 400 Bad Request', async () => {
      const invalidPayloads = [
        { stage: 'PRE_IMPORT', latitude: 'NOT_A_LATITUDE' },
        { stage: 'PRE_IMPORT', longitude: 'NOT_A_LONGITUDE' },
        { stage: 'PRE_IMPORT', delayRiskRating: 'SUPER_CRITICAL_DANGER' },
        { stage: 9999 },
      ];

      for (const payload of invalidPayloads) {
        const res = await app.inject({
          method: 'PATCH',
          url: `/api/shipments/${testShipmentId}/stage`,
          headers: { Authorization: `Bearer ${adminToken}` },
          payload,
        });
        expect(res.statusCode).toBe(400);
      }
    });

    it('2.5 Non-existent and malformed shipment IDs return 404 Not Found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res1 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${nonExistentId}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'SHIPPING' },
      });
      expect(res1.statusCode).toBe(404);
      expect(JSON.parse(res1.payload).error).toBe('Not Found');

      const res2 = await app.inject({
        method: 'PATCH',
        url: '/api/shipments/malformed-non-uuid-id/stage',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'SHIPPING' },
      });
      expect(res2.statusCode).toBe(404);
    });

    it('2.6 Exhaustive RBAC matrix: Unauthorized stakeholders cannot advance stage', async () => {
      // Current stage is PRE_IMPORT. Target stage is SHIPPING.
      // SHIPPING requires SHIPPING_COMPANY or SUPER_ADMIN.
      const unauthorizedTokens = [
        { role: 'IMPORTER_SUPPLIER', token: importerToken },
        { role: 'PORT_OPERATOR', token: portToken },
        { role: 'CUSTOMS_AUTHORITY', token: customsToken },
        { role: 'TRANSPORT_FORWARDER', token: forwarderToken },
        { role: 'FINANCIAL_INSURANCE', token: financeToken },
        { role: 'VEHICLE_REGISTRATION', token: vehicleRegToken },
      ];

      for (const { role, token } of unauthorizedTokens) {
        const res = await app.inject({
          method: 'PATCH',
          url: `/api/shipments/${testShipmentId}/stage`,
          headers: { Authorization: `Bearer ${token}` },
          payload: { stage: 'SHIPPING' },
        });

        expect(res.statusCode).toBe(403);
        const body = JSON.parse(res.payload);
        expect(body.error).toBe('Forbidden');
        expect(body.message).toContain('Advancing to stage SHIPPING requires role');
      }
    });

    it('2.7 Full sequential step-by-step lifecycle traversal with verified role authorization', async () => {
      // Step 1: PRE_IMPORT -> SHIPPING (SHIPPING_COMPANY)
      const res1 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${shippingToken}` },
        payload: { stage: 'SHIPPING', status: 'IN_TRANSIT_SEA', locationName: 'Red Sea / Bab-el-Mandeb' },
      });
      expect(res1.statusCode).toBe(200);
      expect(JSON.parse(res1.payload).shipment.currentStage).toBe('SHIPPING');

      // Step 2: SHIPPING -> PORT_OPERATIONS (PORT_OPERATOR)
      const res2 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${portToken}` },
        payload: { stage: 'PORT_OPERATIONS', status: 'BERTHED', locationName: 'Port of Djibouti - Berth 4' },
      });
      expect(res2.statusCode).toBe(200);
      expect(JSON.parse(res2.payload).shipment.currentStage).toBe('PORT_OPERATIONS');

      // Step 3: PORT_OPERATIONS -> CUSTOMS (CUSTOMS_AUTHORITY)
      const res3 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${customsToken}` },
        payload: { stage: 'CUSTOMS', status: 'VALUATION_ASSESSMENT', locationName: 'Modjo Dry Port Customs Yard' },
      });
      expect(res3.statusCode).toBe(200);
      expect(JSON.parse(res3.payload).shipment.currentStage).toBe('CUSTOMS');

      // Step 4: CUSTOMS -> POST_CUSTOMS (TRANSPORT_FORWARDER)
      const res4 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${forwarderToken}` },
        payload: { stage: 'POST_CUSTOMS', status: 'INLAND_CONVOY', locationName: 'Modjo - Addis Highway Corridor' },
      });
      expect(res4.statusCode).toBe(200);
      expect(JSON.parse(res4.payload).shipment.currentStage).toBe('POST_CUSTOMS');

      // Step 5: POST_CUSTOMS -> DELIVERY (VEHICLE_REGISTRATION)
      const res5 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${vehicleRegToken}` },
        payload: { stage: 'DELIVERY', status: 'MOTL_INSPECTED_DELIVERED', locationName: 'Addis Ababa Vehicle Registration Center' },
      });
      expect(res5.statusCode).toBe(200);
      expect(JSON.parse(res5.payload).shipment.currentStage).toBe('DELIVERY');

      // Step 6: DELIVERY is terminal stage: forward transitions return 400
      const forwardFromTerminal = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'CUSTOMS' },
      });
      expect(forwardFromTerminal.statusCode).toBe(400);

      // Step 7: DELIVERY -> DELIVERY same-stage update IS permitted for final documentation/notes
      const sameTerminalUpdate = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${testShipmentId}/stage`,
        headers: { Authorization: `Bearer ${vehicleRegToken}` },
        payload: { stage: 'DELIVERY', status: 'PLATES_ISSUED', notes: 'Final license plates issued to owner.' },
      });
      expect(sameTerminalUpdate.statusCode).toBe(200);
      expect(JSON.parse(sameTerminalUpdate.payload).shipment.status).toBe('PLATES_ISSUED');
    });

    it('2.8 Cryptographic audit hash chain for the full traversed lifecycle is strictly unbroken', async () => {
      const verifyRes = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/verify/${testShipmentId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(verifyRes.statusCode).toBe(200);
      const body = JSON.parse(verifyRes.payload);
      expect(body.valid).toBe(true);
      expect(body.totalLogs).toBeGreaterThanOrEqual(6); // At least 6 stage transitions & updates
      expect(body.brokenAtLogId).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. GLOBAL AUDIT INTEGRITY UNDER ADVERSARIAL STRESS
  // =========================================================================
  describe('3. Global Audit Integrity Under Adversarial Stress', () => {
    it('3.1 Global audit chain across all database records remains 100% valid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/verify',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.valid).toBe(true);
      expect(body.totalLogs).toBeGreaterThan(0);
      expect(body.brokenAtLogId).toBeUndefined();
    });

    it('3.2 Rapid sequential writes on a single shipment produce strictly unbroken cryptographic chain', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const shp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-RAPID-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          currentStage: 'PRE_IMPORT',
          importerId: importer!.id,
        },
      });

      const burstCount = 10;
      await Promise.all(
        Array.from({ length: burstCount }).map((_, i) =>
          AuditLoggerService.recordLog(app.prisma, {
            shipmentId: shp.id,
            actorId: importer!.id,
            actorRole: importer!.role,
            actorName: importer!.fullName,
            action: 'NOTE_APPENDED',
            stage: 'PRE_IMPORT',
            details: `Rapid concurrent event ${i + 1}/${burstCount}`,
            newStateJson: { burstIndex: i + 1 },
          })
        )
      );

      const verifyRes = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/verify/${shp.id}`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(verifyRes.statusCode).toBe(200);
      const verifyBody = JSON.parse(verifyRes.payload);
      expect(verifyBody.valid).toBe(true);
      expect(verifyBody.totalLogs).toBe(burstCount);
    });
  });
});
