import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { seed } from '../prisma/seed';
import { AuditLoggerService } from '../src/services/audit-logger.service';

describe('Challenger 2 — Audit Trail & Lifecycle State Machine Empirical Stress Suite', () => {
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
      const body = JSON.parse(res.payload);
      return body.token;
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
  // 1. AUDIT TRAIL IMMUTABILITY & TAMPER DETECTION
  // =========================================================================
  describe('1. Audit Trail Hash Chaining & Tamper Detection', () => {
    it('1.1 Baseline: All seeded audit log chains pass verification', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/verify',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.valid).toBe(true);
      expect(data.totalLogs).toBeGreaterThan(0);
      expect(data.message).toContain('Audit chain verified successfully');
    });

    it('1.2 Tamper Test: Mutating recorded hash is detected with specific error message', async () => {
      const targetLog = await app.prisma.auditLog.findFirst({
        where: { shipmentId: { not: null } },
      });
      expect(targetLog).toBeDefined();

      const originalHash = targetLog!.hash;
      const forgedHash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      try {
        await app.prisma.auditLog.update({
          where: { id: targetLog!.id },
          data: { hash: forgedHash },
        });

        const verifyRes = await app.inject({
          method: 'GET',
          url: `/api/audit-logs/verify/${targetLog!.shipmentId}`,
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        expect(verifyRes.statusCode).toBe(200);
        const data = JSON.parse(verifyRes.payload);
        expect(data.valid).toBe(false);
        expect(data.brokenAtLogId).toBe(targetLog!.id);
        expect(data.message).toContain('Tampered hash at log');
      } finally {
        await app.prisma.auditLog.update({
          where: { id: targetLog!.id },
          data: { hash: originalHash },
        });
      }
    });

    it('1.3 Tamper Test: Mutating action is detected by hash recalculation', async () => {
      const targetLog = await app.prisma.auditLog.findFirst({
        where: { shipmentId: { not: null } },
      });
      expect(targetLog).toBeDefined();

      const originalAction = targetLog!.action;

      try {
        await app.prisma.auditLog.update({
          where: { id: targetLog!.id },
          data: { action: 'ILLICIT_SMUGGLING_OVERRIDE' },
        });

        const verifyRes = await app.inject({
          method: 'GET',
          url: `/api/audit-logs/verify/${targetLog!.shipmentId}`,
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        const data = JSON.parse(verifyRes.payload);
        expect(data.valid).toBe(false);
        expect(data.brokenAtLogId).toBe(targetLog!.id);
        expect(data.message).toContain('Tampered hash at log');
      } finally {
        await app.prisma.auditLog.update({
          where: { id: targetLog!.id },
          data: { action: originalAction },
        });
      }
    });

    it('1.4 Tamper Test: Mutating previousHash breaks chain link and is detected', async () => {
      const shipment = await app.prisma.shipment.findFirst({
        where: { currentStage: 'CUSTOMS' },
        include: { auditLogs: { orderBy: { timestamp: 'asc' } } },
      });
      expect(shipment).toBeDefined();
      expect(shipment!.auditLogs.length).toBeGreaterThan(1);

      const targetLog = shipment!.auditLogs[1];
      const originalPrevHash = targetLog.previousHash;

      try {
        await app.prisma.auditLog.update({
          where: { id: targetLog.id },
          data: { previousHash: '0000000000000000000000000000000000000000000000000000000000000000' },
        });

        const verifyRes = await app.inject({
          method: 'GET',
          url: `/api/audit-logs/verify/${shipment!.id}`,
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        const data = JSON.parse(verifyRes.payload);
        expect(data.valid).toBe(false);
        expect(data.brokenAtLogId).toBe(targetLog.id);
        expect(data.message).toContain('Hash link mismatch at log');
      } finally {
        await app.prisma.auditLog.update({
          where: { id: targetLog.id },
          data: { previousHash: originalPrevHash },
        });
      }
    });

    it('1.5 Tamper Test: Deleting an intermediate log is detected as a broken link', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-TEST-DEL-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      const l1 = await AuditLoggerService.recordLog(app.prisma, { shipmentId: testShp.id, action: 'L1', stage: 'PRE_IMPORT' });
      const l2 = await AuditLoggerService.recordLog(app.prisma, { shipmentId: testShp.id, action: 'L2', stage: 'SHIPPING' });
      const l3 = await AuditLoggerService.recordLog(app.prisma, { shipmentId: testShp.id, action: 'L3', stage: 'PORT_OPERATIONS' });

      // Before deletion: valid
      const vBefore = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(vBefore.valid).toBe(true);
      expect(vBefore.totalLogs).toBe(3);

      // Adversarial action: delete intermediate log l2
      await app.prisma.auditLog.delete({ where: { id: l2.id } });

      // After deletion: must fail
      const vAfter = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      expect(vAfter.valid).toBe(false);
      expect(vAfter.brokenAtLogId).toBe(l3.id);
      expect(vAfter.message).toContain('Hash link mismatch at log');

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: testShp.id } });
      await app.prisma.shipment.delete({ where: { id: testShp.id } });
    });

    it('1.6 Adversarial Vulnerability Probe: Mutating payload details/newStateJson WITHOUT modifying hash', async () => {
      const targetLog = await app.prisma.auditLog.findFirst({
        where: { shipmentId: { not: null } },
      });
      expect(targetLog).toBeDefined();

      const originalDetails = targetLog!.details;
      const originalNewState = targetLog!.newStateJson;

      try {
        await app.prisma.auditLog.update({
          where: { id: targetLog!.id },
          data: {
            details: 'TAMPERED: 0 ETB Duty Paid (Bribe Confirmed)',
            newStateJson: JSON.stringify({ forgedDuty: 0, bypassedCustoms: true }),
          },
        });

        const verifyRes = await app.inject({
          method: 'GET',
          url: `/api/audit-logs/verify/${targetLog!.shipmentId}`,
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        const data = JSON.parse(verifyRes.payload);
        console.log('[EMPIRICAL OBSERVATION 1.6] Payload tamper detected?', data.valid === false, data);
        expect(data).toHaveProperty('valid');
        expect(data.valid).toBe(false);
        expect(data.brokenAtLogId).toBe(targetLog!.id);
      } finally {
        await app.prisma.auditLog.update({
          where: { id: targetLog!.id },
          data: { details: originalDetails, newStateJson: originalNewState },
        });
      }
    });
  });

  // =========================================================================
  // 2. SHIPMENT LIFECYCLE STATE MACHINE & ILLEGAL TRANSITIONS
  // =========================================================================
  describe('Suite 2: Lifecycle State Machine Transitions & Illegal Stage Jumps', () => {
    it('2.1 Illegal Stage Jump: Attempt PRE_IMPORT directly to DELIVERY (skipping 4 stages)', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const shipment = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-JUMP-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
          status: 'DRAFT',
        },
      });

      // Super Admin attempts illegal jump: PRE_IMPORT -> DELIVERY
      const jumpRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          stage: 'DELIVERY',
          status: 'DELIVERED',
        },
      });

      console.log('[EMPIRICAL OBSERVATION 2.1] PRE_IMPORT -> DELIVERY status code:', jumpRes.statusCode, jumpRes.payload);
      const isJumpAllowed = jumpRes.statusCode === 200;
      console.log('[EMPIRICAL OBSERVATION 2.1] Did backend permit skipping 4 intermediate stages?', isJumpAllowed);
      expect(jumpRes.statusCode).toBe(400);
      expect(isJumpAllowed).toBe(false);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: shipment.id } });
      await app.prisma.shipment.delete({ where: { id: shipment.id } });
    });

    it('2.2 Illegal Stage Regression: Attempt DELIVERY back to PRE_IMPORT', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      // Create a delivered shipment
      const deliveredShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-DELIV-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Addis Ababa',
          importerId: importer!.id,
          currentStage: 'DELIVERY',
          status: 'DELIVERED',
        },
      });

      const regRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${deliveredShp.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          stage: 'PRE_IMPORT',
          status: 'RESET_TO_DRAFT',
        },
      });

      console.log('[EMPIRICAL OBSERVATION 2.2] DELIVERY -> PRE_IMPORT status code:', regRes.statusCode, regRes.payload);
      const isRegressionAllowed = regRes.statusCode === 200;
      console.log('[EMPIRICAL OBSERVATION 2.2] Did backend permit backward state regression?', isRegressionAllowed);
      expect(regRes.statusCode).toBe(400);
      expect(isRegressionAllowed).toBe(false);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: deliveredShp.id } });
      await app.prisma.shipment.delete({ where: { id: deliveredShp.id } });
    });

    it('2.3 Illegal Stage: Reject invalid stage enum values', async () => {
      const shipment = await app.prisma.shipment.findFirst();
      expect(shipment).toBeDefined();

      const invalidRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${shipment!.id}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: {
          stage: 'ILLEGAL_FLYING_CAR_STAGE',
        },
      });

      expect(invalidRes.statusCode).toBe(400);
      const data = JSON.parse(invalidRes.payload);
      expect(data.error).toBe('Bad Request');
    });

    it('2.4 Role Permission Enforcement on Stage Transitions', async () => {
      const preImportShipment = await app.prisma.shipment.findFirst({
        where: { currentStage: 'PRE_IMPORT' },
      });
      expect(preImportShipment).toBeDefined();

      // Importer cannot advance stage to SHIPPING
      const impRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${preImportShipment!.id}/stage`,
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: { stage: 'SHIPPING' },
      });
      expect(impRes.statusCode).toBe(403);

      // Shipping company CAN advance stage to SHIPPING
      const shipRes = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${preImportShipment!.id}/stage`,
        headers: { Authorization: `Bearer ${shippingToken}` },
        payload: { stage: 'SHIPPING', status: 'IN_TRANSIT' },
      });
      expect(shipRes.statusCode).toBe(200);

      // Restore shipment stage back to PRE_IMPORT
      await app.prisma.shipment.update({
        where: { id: preImportShipment!.id },
        data: { currentStage: 'PRE_IMPORT', status: 'DRAFT' },
      });
    });
  });

  // =========================================================================
  // 3. CONCURRENCY & DUPLICATE KEY HANDLING
  // =========================================================================
  describe('Suite 3: Concurrency & Duplicate Key Prevention', () => {
    it('3.1 Concurrent audit logging stress test: parallel writes on single shipment', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-CONC-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      // Rapidly launch 6 parallel audit logs
      const promises = [1, 2, 3, 4, 5, 6].map((idx) =>
        AuditLoggerService.recordLog(app.prisma, {
          shipmentId: testShp.id,
          action: `CONCURRENT_EVENT_${idx}`,
          stage: 'PRE_IMPORT',
          details: `Parallel write test index ${idx}`,
        })
      );

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      console.log(`[EMPIRICAL OBSERVATION 3.1] Parallel audit logs recorded: ${fulfilled.length}/${promises.length}`);

      // Now verify if the audit chain remains cryptographically valid
      const vResult = await AuditLoggerService.verifySingleChain(app.prisma, testShp.id);
      console.log('[EMPIRICAL OBSERVATION 3.1] Chain integrity after concurrent writes:', vResult);
      expect(vResult.valid).toBe(true);

      // Cleanup
      await app.prisma.auditLog.deleteMany({ where: { shipmentId: testShp.id } });
      await app.prisma.shipment.delete({ where: { id: testShp.id } });
    });

    it('3.2 Duplicate trackingNumber uniqueness test', async () => {
      const existing = await app.prisma.shipment.findFirst();
      expect(existing).toBeDefined();

      let threw = false;
      try {
        await app.prisma.shipment.create({
          data: {
            trackingNumber: existing!.trackingNumber,
            originPort: 'Origin',
            destinationPort: 'Dest',
            importerId: existing!.importerId,
          },
        });
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('P2002'); // Prisma unique constraint violation
      }
      expect(threw).toBe(true);
    });

    it('3.3 Duplicate VIN uniqueness test in Shipment Creation API', async () => {
      const existingVehicle = await app.prisma.vehicle.findFirst();
      expect(existingVehicle).toBeDefined();

      // Attempt to create a shipment with a vehicle having an already existing VIN
      const dupRes = await app.inject({
        method: 'POST',
        url: '/api/shipments',
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: {
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          vehicles: [
            {
              vin: existingVehicle!.vin, // Duplicate VIN
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

      console.log('[EMPIRICAL OBSERVATION 3.3] Duplicate VIN creation status code:', dupRes.statusCode, dupRes.payload);
      expect(dupRes.statusCode).toBe(409);
      expect(JSON.parse(dupRes.payload).error).toBe('Conflict');
    });
  });

  // =========================================================================
  // 4. REFERENTIAL INTEGRITY UNDER STRESS
  // =========================================================================
  describe('Suite 4: Database Referential Integrity Under Stress', () => {
    it('4.1 Foreign Key Constraint: Vehicle cannot reference non-existent shipmentId', async () => {
      let threw = false;
      try {
        await app.prisma.vehicle.create({
          data: {
            shipmentId: '00000000-0000-0000-0000-000000000000',
            vin: `VIN-FK-${Date.now()}`,
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            engineCc: 1800,
            fuelType: 'PETROL',
            cifValue: 1200000,
            color: 'White',
            qrCodePayload: 'test',
          },
        });
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('P2003');
      }
      expect(threw).toBe(true);
    });

    it('4.2 Foreign Key Constraint: Document cannot reference non-existent shipmentId', async () => {
      let threw = false;
      try {
        await app.prisma.document.create({
          data: {
            shipmentId: 'non-existent-shipment-uuid',
            type: 'COMMERCIAL_INVOICE',
            fileName: 'invoice.pdf',
            filePath: '/uploads/invoice.pdf',
          },
        });
      } catch (err: any) {
        threw = true;
        expect(err.code).toBe('P2003');
      }
      expect(threw).toBe(true);
    });

    it('4.3 Cascade Deletion & Audit Trail Preservation (onDelete: SetNull)', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-REF-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          vehicles: {
            create: {
              vin: `VIN-REF-${Date.now()}`,
              make: 'BYD',
              model: 'Atto 3',
              year: 2025,
              engineCc: 0,
              fuelType: 'ELECTRIC',
              cifValue: 1800000,
              color: 'Blue',
              qrCodePayload: 'test-byd',
            },
          },
          documents: {
            create: {
              type: 'BILL_OF_LADING',
              fileName: 'bol-ref.pdf',
              filePath: '/uploads/bol-ref.pdf',
            },
          },
        },
        include: { vehicles: true, documents: true },
      });

      const auditLog = await AuditLoggerService.recordLog(app.prisma, {
        shipmentId: testShp.id,
        action: 'SHIPMENT_CREATED',
        stage: 'PRE_IMPORT',
      });

      // Delete the parent shipment
      await app.prisma.shipment.delete({ where: { id: testShp.id } });

      // Vehicles & documents must be deleted (Cascade)
      const survivingVehicles = await app.prisma.vehicle.findMany({ where: { shipmentId: testShp.id } });
      expect(survivingVehicles.length).toBe(0);

      const survivingDocs = await app.prisma.document.findMany({ where: { shipmentId: testShp.id } });
      expect(survivingDocs.length).toBe(0);

      // Audit log must NOT be deleted; shipmentId must become null (SetNull)
      const survivingLog = await app.prisma.auditLog.findUnique({ where: { id: auditLog.id } });
      expect(survivingLog).toBeDefined();
      expect(survivingLog!.shipmentId).toBeNull();

      // Clean up the surviving audit log
      await app.prisma.auditLog.delete({ where: { id: auditLog.id } });
    });

    it('4.4 Orphaned Audit Logs from Deleted Shipments: Impact on Global Verification', async () => {
      const importer = await app.prisma.user.findFirst({ where: { role: 'IMPORTER_SUPPLIER' } });
      const testShp = await app.prisma.shipment.create({
        data: {
          trackingNumber: `ET-SHP-DEL-VERIFY-${Date.now()}`,
          originPort: 'Dubai',
          destinationPort: 'Modjo',
          importerId: importer!.id,
          currentStage: 'PRE_IMPORT',
        },
      });

      const log = await AuditLoggerService.recordLog(app.prisma, {
        shipmentId: testShp.id,
        action: 'SHIPMENT_CREATED',
        stage: 'PRE_IMPORT',
      });

      // Global verify passes prior to deletion
      const vBefore = await AuditLoggerService.verifyChain(app.prisma);
      expect(vBefore.valid).toBe(true);

      // Now delete shipment (audit log survives with shipmentId = null due to SetNull)
      await app.prisma.shipment.delete({ where: { id: testShp.id } });

      // Now run global verify: verifyChain checks verifySingleChain(prisma, null)
      const vAfter = await AuditLoggerService.verifyChain(app.prisma);
      console.log('[EMPIRICAL OBSERVATION 4.4] Global verify after shipment deletion:', vAfter);
      expect(vAfter.valid).toBe(true);

      // Cleanup surviving log to restore clean DB state
      await app.prisma.auditLog.delete({ where: { id: log.id } });
    });
  });
});
