import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { seed } from '../prisma/seed';
import { AuditLoggerService } from '../src/services/audit-logger.service';

describe('Remediation M1-2: 5 Empirical Defect Verifications', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let importerToken: string;
  let shippingToken: string;
  let portToken: string;
  let customsToken: string;
  let forwarderToken: string;
  let vehicleRegToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await seed(app.prisma);

    const loginRole = async (email: string) => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, password: 'Demo@2026!', demoBypass: true },
      });
      return JSON.parse(res.payload).token;
    };

    adminToken = await loginRole('admin@ncis.gov.et');
    importerToken = await loginRole('importer@ethioimport.com');
    shippingToken = await loginRole('shipping@ethiopian-shipping.com');
    portToken = await loginRole('port@djibouti-port.com');
    customsToken = await loginRole('customs@ecc.gov.et');
    forwarderToken = await loginRole('forwarder@ethio-transit.com');
    vehicleRegToken = await loginRole('fta@motl.gov.et');
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. STRICT SEQUENTIAL STATE MACHINE
  // =========================================================================
  describe('Defect 1: Strict Sequential State Machine Transitions', () => {
    it('rejects illegal forward jumps with HTTP 400 Bad Request', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const shipment = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-FSM-JUMP-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      // Illegal jump: PRE_IMPORT -> DELIVERY
      const jumpRes1 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'DELIVERY' },
      });
      expect(jumpRes1.statusCode).toBe(400);
      const data1 = JSON.parse(jumpRes1.payload);
      expect(data1.error).toBe('Bad Request');
      expect(data1.message).toContain('Illegal state transition');
      expect(data1.message).toContain('PRE_IMPORT to DELIVERY');

      // Illegal jump: PRE_IMPORT -> CUSTOMS
      const jumpRes2 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'CUSTOMS' },
      });
      expect(jumpRes2.statusCode).toBe(400);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: shipment.id } });
      await app.prisma.shipment.delete({ where: { id: shipment.id } });
    });

    it('rejects backward state regressions with HTTP 400 Bad Request', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const shipment = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-FSM-REG-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'DELIVERY',
          status: 'DELIVERED',
        },
      });

      // Regression: DELIVERY -> PRE_IMPORT
      const regRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'PRE_IMPORT' },
      });
      expect(regRes.statusCode).toBe(400);
      const data = JSON.parse(regRes.payload);
      expect(data.error).toBe('Bad Request');
      expect(data.message).toContain('Illegal state transition');

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: shipment.id } });
      await app.prisma.shipment.delete({ where: { id: shipment.id } });
    });

    it('allows valid sequential step-by-step progression and same-stage updates', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const shipment = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-FSM-SEQ-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      // Same-stage update is allowed
      const sameRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'PRE_IMPORT', notes: 'Initial notes update' },
      });
      expect(sameRes.statusCode).toBe(200);

      // PRE_IMPORT -> SHIPPING
      const step1 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${shippingToken}` },
        payload: { stage: 'SHIPPING', status: 'IN_TRANSIT' },
      });
      expect(step1.statusCode).toBe(200);

      // SHIPPING -> PORT_OPERATIONS
      const step2 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${portToken}` },
        payload: { stage: 'PORT_OPERATIONS', status: 'BERTHED' },
      });
      expect(step2.statusCode).toBe(200);

      // PORT_OPERATIONS -> CUSTOMS
      const step3 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${customsToken}` },
        payload: { stage: 'CUSTOMS', status: 'ASSESSING' },
      });
      expect(step3.statusCode).toBe(200);

      // CUSTOMS -> POST_CUSTOMS
      const step4 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${forwarderToken}` },
        payload: { stage: 'POST_CUSTOMS', status: 'DISPATCHED' },
      });
      expect(step4.statusCode).toBe(200);

      // POST_CUSTOMS -> DELIVERY
      const step5 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${vehicleRegToken}` },
        payload: { stage: 'DELIVERY', status: 'DELIVERED' },
      });
      expect(step5.statusCode).toBe(200);

      // DELIVERY is terminal: cannot transition further
      const step6 = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'CUSTOMS' },
      });
      expect(step6.statusCode).toBe(400);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: shipment.id } });
      await app.prisma.shipment.delete({ where: { id: shipment.id } });
    });
  });

  // =========================================================================
  // 2. AUDIT LOG PAYLOAD TAMPER DETECTION
  // =========================================================================
  describe('Defect 2: Audit Log Payload Hashing & Tamper Detection', () => {
    it('detects tampering of details, newStateJson, previousStateJson, and stage', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-TAMPER-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      const log = await AuditLoggerService.recordLog(app.prisma, {
        shipmentId: testShp.id,
        action: 'CUSTOMS_DUTY_ASSESSED',
        stage: 'CUSTOMS',
        details: 'Assessed duty: 500,000 ETB',
        previousStateJson: { duty: 0 },
        newStateJson: { duty: 500000, settled: true },
      });

      // Chain initially valid
      const initialVerify = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(initialVerify.valid).toBe(true);

      // 1. Tamper details
      await app.prisma.auditLog.update({
        where: { id: log.id },
        data: { details: 'TAMPERED: 0 ETB Duty' },
      });
      const verifyDetailsTamper = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(verifyDetailsTamper.valid).toBe(false);
      expect(verifyDetailsTamper.brokenAtLogId).toBe(log.id);

      // Restore details, tamper newStateJson
      await app.prisma.auditLog.update({
        where: { id: log.id },
        data: {
          details: 'Assessed duty: 500,000 ETB',
          newStateJson: JSON.stringify({ duty: 0, settled: true, _shipmentId: testShp.id }),
        },
      });
      const verifyStateTamper = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(verifyStateTamper.valid).toBe(false);
      expect(verifyStateTamper.brokenAtLogId).toBe(log.id);

      // Restore state, tamper stage
      await app.prisma.auditLog.update({
        where: { id: log.id },
        data: {
          newStateJson: log.newStateJson,
          stage: 'DELIVERY',
        },
      });
      const verifyStageTamper = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(verifyStageTamper.valid).toBe(false);
      expect(verifyStageTamper.brokenAtLogId).toBe(log.id);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: testShp.id } });
      await app.prisma.shipment.delete({ where: { id: testShp.id } });
    });
  });

  // =========================================================================
  // 3. CONCURRENCY MUTEX PROTECTION
  // =========================================================================
  describe('Defect 3: Concurrency Protection on Rapid Writes', () => {
    it('maintains continuous unbroken cryptographic hash chain under rapid concurrent writes', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-MUTEX-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      // Launch 10 parallel write calls
      const writes = Array.from({ length: 10 }, (_, i) =>
        AuditLoggerService.recordLog(app.prisma, {
          shipmentId: testShp.id,
          action: `CONCURRENT_EVENT_${i + 1}`,
          stage: 'PRE_IMPORT',
          details: `Concurrent write event payload ${i + 1}`,
        })
      );

      const settled = await Promise.allSettled(writes);
      expect(settled.every((s) => s.status === 'fulfilled')).toBe(true);

      const logs = await app.prisma.auditLog.findMany({
        where: { shipmentId: testShp.id },
        orderBy: { timestamp: 'asc' },
      });
      expect(logs.length).toBe(10);

      // Verify no duplicate previousHash
      const prevHashes = logs.map((l) => l.previousHash);
      const uniquePrevHashes = new Set(prevHashes);
      expect(uniquePrevHashes.size).toBe(10);

      // Cryptographic chain verification
      const verifyResult = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.totalLogs).toBe(10);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: testShp.id } });
      await app.prisma.shipment.delete({ where: { id: testShp.id } });
    });
  });

  // =========================================================================
  // 4. ORPHANED AUDIT LOG HANDLING ON DELETED SHIPMENTS
  // =========================================================================
  describe('Defect 4: Orphaned Audit Log Handling on Deleted Shipments', () => {
    it('preserves audit chain validity when parent shipment is deleted', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-ORPHAN-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      const log1 = await AuditLoggerService.recordLog(app.prisma, {
        shipmentId: testShp.id,
        action: 'SHIPMENT_CREATED',
        stage: 'PRE_IMPORT',
        details: 'Initial shipment creation',
      });

      const log2 = await AuditLoggerService.recordLog(app.prisma, {
        shipmentId: testShp.id,
        action: 'VESSEL_DEPARTED',
        stage: 'SHIPPING',
        details: 'Vessel transit started',
      });

      // Verify valid before deletion
      const vBefore = await AuditLoggerService.verifyChain(app.prisma);
      expect(vBefore.valid).toBe(true);

      // Delete parent shipment
      await app.prisma.shipment.delete({ where: { id: testShp.id } });

      // Surviving logs have shipmentId = null (SetNull constraint)
      const surviving = await app.prisma.auditLog.findMany({
        where: { id: { in: [log1.id, log2.id] } },
      });
      expect(surviving.length).toBe(2);
      expect(surviving[0].shipmentId).toBeNull();
      expect(surviving[1].shipmentId).toBeNull();

      // Global verifyChain must remain valid
      const vAfter = await AuditLoggerService.verifyChain(app.prisma);
      expect(vAfter.valid).toBe(true);

      // Cleanup surviving logs
      await app.prisma.auditLog.deleteMany({ where: { id: { in: [log1.id, log2.id] } } });
    });
  });

  // =========================================================================
  // 5. DUPLICATE VIN CONFLICT HANDLING
  // =========================================================================
  describe('Defect 5: Duplicate VIN Conflict (HTTP 409) Handling', () => {
    it('returns HTTP 409 Conflict when submitting existing VIN in POST /api/shipments', async () => {
      const existing = await app.prisma.vehicle.findFirst();
      expect(existing).toBeDefined();

      const dupRes = await app.inject({
        method: 'POST',
        url: '/api/shipments',
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: {
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          vehicles: [
            {
              vin: existing!.vin,
              make: 'Toyota',
              model: 'Hilux',
              year: 2025,
              engineCc: 2755,
              fuelType: 'DIESEL',
              cifValue: 2500000,
            },
          ],
        },
      });

      expect(dupRes.statusCode).toBe(409);
      const data = JSON.parse(dupRes.payload);
      expect(data.error).toBe('Conflict');
      expect(data.message).toBe('A vehicle with this VIN already exists');
    });

    it('returns HTTP 409 Conflict when submitting existing VIN in POST /api/vehicles', async () => {
      const existing = await app.prisma.vehicle.findFirst();
      expect(existing).toBeDefined();

      const dupRes = await app.inject({
        method: 'POST',
        url: '/api/vehicles',
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          shipmentId: existing!.shipmentId,
          vin: existing!.vin,
          make: 'Toyota',
          model: 'Hilux',
          year: 2025,
          engineCc: 2755,
          fuelType: 'DIESEL',
          cifValue: 2500000,
        },
      });

      expect(dupRes.statusCode).toBe(409);
      const data = JSON.parse(dupRes.payload);
      expect(data.error).toBe('Conflict');
      expect(data.message).toBe('A vehicle with this VIN already exists');
    });
  });
});
