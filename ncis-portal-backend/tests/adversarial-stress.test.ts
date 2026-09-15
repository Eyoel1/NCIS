import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { buildApp } from '../src/app';

describe('NCIS Portal - Empirical Adversarial Stress & Security Testing', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let importerToken: string;
  let shippingToken: string;
  let portToken: string;
  let customsToken: string;
  let forwarderToken: string;
  let financeToken: string;
  let registrationToken: string;
  let sampleShipmentId: string;
  let sampleVehicleId: string;
  let sampleDeclarationId: string;
  let strictUserEmail = 'strict.user@ncis.gov.et';

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Acquire tokens for all institutional roles via official /demo-switch
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
    financeToken = await getRoleToken('FINANCIAL_INSURANCE');
    registrationToken = await getRoleToken('VEHICLE_REGISTRATION');

    // Create a strict user with demoTwoFactorBypass: false to test true 2FA enforcement
    await app.prisma.user.deleteMany({ where: { email: strictUserEmail } });
    await app.prisma.user.create({
      data: {
        email: strictUserEmail,
        passwordHash: bcrypt.hashSync('StrictSecret@2026!', 10),
        fullName: 'Strict Test Officer',
        role: 'CUSTOMS_AUTHORITY',
        organization: 'Customs Directorate',
        demoTwoFactorBypass: false,
        twoFactorSecret: 'VALID_2FA_SECRET_777',
      },
    });

    // Retrieve active sample records
    const shipment = await app.prisma.shipment.findFirst({
      include: { vehicles: true, customsDeclaration: true },
    });
    sampleShipmentId = shipment!.id;
    sampleVehicleId = shipment!.vehicles[0]?.id || '';
    sampleDeclarationId = shipment!.customsDeclaration?.id || '';
  });

  afterAll(async () => {
    if (app) {
      await app.prisma.user.deleteMany({ where: { email: strictUserEmail } });
      await app.close();
    }
  });

  // =========================================================================
  // 1. AUTHENTICATION, RBAC & TOKEN STRESS TESTING
  // =========================================================================
  describe('1. Authentication & RBAC Adversarial Tests', () => {
    it('1.1 Should reject completely malformed JWT tokens with 401', async () => {
      const malformedTokens = [
        'invalid.token.structure',
        'Bearer invalid_base64_payload',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsig',
        'Bearer ',
        'Basic YWRtaW46cGFzc3dvcmQ=',
        '',
      ];

      for (const token of malformedTokens) {
        const res = await app.inject({
          method: 'GET',
          url: '/api/auth/me',
          headers: token ? { Authorization: token } : {},
        });
        expect(res.statusCode).toBe(401);
        const body = JSON.parse(res.payload);
        expect(body.error).toBe('Unauthorized');
      }
    });

    it('1.2 Should reject cryptographically tampered JWT payload with 401', async () => {
      const parts = adminToken.split('.');
      const payloadObj = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      payloadObj.role = 'SUPER_ADMIN_TAMPERED';
      const tamperedPayload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: { Authorization: `Bearer ${tamperedToken}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it('1.3 Should reject unauthorized demo-role impersonation with non-existent roles', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/shipments',
        headers: { 'x-demo-role': 'NON_EXISTENT_SUPER_HACKER' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('1.4 RBAC: Importer cannot execute technical roadworthiness inspection (Requires VEHICLE_REGISTRATION)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/vehicles/${sampleVehicleId}/inspect`,
        headers: { Authorization: `Bearer ${importerToken}` },
        payload: { roadworthyStatus: 'PASSED' },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('Allowed roles');
    });

    it('1.5 RBAC: Port Operator cannot file formal customs declarations (Requires CUSTOMS_AUTHORITY / IMPORTER / FORWARDER)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/declarations',
        headers: { Authorization: `Bearer ${portToken}` },
        payload: { shipmentId: sampleShipmentId },
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).error).toBe('Forbidden');
    });

    it('1.6 RBAC: Shipping Company cannot settle customs duty payments (Requires FINANCIAL_INSURANCE / CUSTOMS_AUTHORITY)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/customs/declarations/${sampleDeclarationId}/pay`,
        headers: { Authorization: `Bearer ${shippingToken}` },
        payload: { paymentReference: 'UNAUTHORIZED-SETTLE-TEST' },
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).error).toBe('Forbidden');
    });

    it('1.7 RBAC: Customs Authority cannot allocate license plates (Requires VEHICLE_REGISTRATION)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/vehicles/${sampleVehicleId}/allocate-plate`,
        headers: { Authorization: `Bearer ${customsToken}` },
        payload: { plateNumber: 'ET-AA-3-99999' },
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).error).toBe('Forbidden');
    });

    it('1.8 RBAC: Shipping Line cannot advance shipment stage to CUSTOMS (Requires CUSTOMS_AUTHORITY)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${sampleShipmentId}/stage`,
        headers: { Authorization: `Bearer ${shippingToken}` },
        payload: { stage: 'CUSTOMS', status: 'UNAUTHORIZED_STAGE_JUMP' },
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).error).toBe('Forbidden');
    });

    it('1.9 RBAC: Freight Forwarder cannot advance shipment stage to DELIVERY (Requires VEHICLE_REGISTRATION)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${sampleShipmentId}/stage`,
        headers: { Authorization: `Bearer ${forwarderToken}` },
        payload: { stage: 'DELIVERY', status: 'UNAUTHORIZED_DELIVERY' },
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).error).toBe('Forbidden');
    });

    it('1.10 2FA Enforcement: Strict user without bypass requires 2FA and blocks token on invalid code', async () => {
      const badCodes = ['000000', '999999', 'ABCDEF', '!@#$%^', 'wrong'];

      for (const badCode of badCodes) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          payload: {
            email: strictUserEmail,
            password: 'StrictSecret@2026!',
            twoFactorCode: badCode,
          },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).not.toHaveProperty('token');
        expect(body.twoFactorRequired).toBe(true);
        expect(body.message).toContain('Two-factor authentication required');
      }
    });

    it('1.11 2FA Verification: Strict user verify-2fa rejects invalid codes with 401', async () => {
      // 1. Missing email -> 400
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/auth/verify-2fa',
        payload: { code: '123456' },
      });
      expect(res1.statusCode).toBe(400);

      // 2. Non-existent user email -> 404
      const res2 = await app.inject({
        method: 'POST',
        url: '/api/auth/verify-2fa',
        payload: { email: 'nonexistent@ncis.gov.et', code: '123456' },
      });
      expect(res2.statusCode).toBe(404);

      // 3. Incorrect 2FA code for strict user -> 401
      const res3 = await app.inject({
        method: 'POST',
        url: '/api/auth/verify-2fa',
        payload: { email: strictUserEmail, code: 'WRONG_CODE_999' },
      });
      expect(res3.statusCode).toBe(401);
      const body3 = JSON.parse(res3.payload);
      expect(body3.error).toBe('Unauthorized');
      expect(body3.message).toBe('Invalid 2FA code');

      // 4. Demo bypass code 123456 succeeds -> 200 with valid JWT
      const res4 = await app.inject({
        method: 'POST',
        url: '/api/auth/verify-2fa',
        payload: { email: strictUserEmail, code: '123456' },
      });
      expect(res4.statusCode).toBe(200);
      const body4 = JSON.parse(res4.payload);
      expect(body4).toHaveProperty('token');
      expect(body4.user.email).toBe(strictUserEmail);
    });

    it('1.12 Unauthenticated access to sensitive non-public endpoints must fail with 401', async () => {
      const endpoints = [
        { method: 'GET', url: '/api/shipments' },
        { method: 'POST', url: '/api/shipments' },
        { method: 'GET', url: `/api/shipments/${sampleShipmentId}` },
        { method: 'GET', url: '/api/audit-logs' },
        { method: 'GET', url: '/api/audit-logs/verify' },
        { method: 'GET', url: '/api/vehicles' },
        { method: 'POST', url: '/api/documents' },
        { method: 'GET', url: `/api/documents/shipment/${sampleShipmentId}` },
        { method: 'GET', url: '/api/tickets' },
        { method: 'POST', url: '/api/tickets' },
      ];

      for (const ep of endpoints) {
        const res = await app.inject({
          method: ep.method as any,
          url: ep.url,
        });
        expect(res.statusCode).toBe(401);
      }
    });
  });

  // =========================================================================
  // 2. PUBLIC TRACKING & INJECTION STRESS TESTING
  // =========================================================================
  describe('2. Public Tracking & Injection Adversarial Tests', () => {
    it('2.1 SQL Injection payloads on public tracking route must be neutralized and return 404', async () => {
      const sqliPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE Shipment; --",
        "' UNION SELECT id, email, passwordHash FROM User --",
        "1' OR '1' = '1' --",
        "admin'--",
        "\" OR \"\"=\"",
        "'; EXEC xp_cmdshell('dir'); --",
      ];

      for (const payload of sqliPayloads) {
        const encoded = encodeURIComponent(payload);
        const res = await app.inject({
          method: 'GET',
          url: `/api/public/track/${encoded}`,
        });
        expect(res.statusCode).toBe(404);
        const body = JSON.parse(res.payload);
        expect(body.error).toBe('Not Found');
        expect(body.message).toContain('No active import dossier located');
      }

      // Verify that database was NOT dropped or modified
      const shipmentCount = await app.prisma.shipment.count();
      expect(shipmentCount).toBeGreaterThan(0);
    });

    it('2.2 NoSQL & special parameter injection on tracking route', async () => {
      const specialPayloads = [
        '{"$gt": ""}',
        '{"$where": "sleep(1000)"}',
        '<script>alert("XSS")</script>',
        'javascript:alert(1)',
        '../../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'CON.txt',
        'NUL',
      ];

      for (const p of specialPayloads) {
        const encoded = encodeURIComponent(p);
        const res = await app.inject({
          method: 'GET',
          url: `/api/public/track/${encoded}`,
        });
        expect(res.statusCode).toBe(404);
      }
    });

    it('2.3 Extreme buffer length query string on tracking route (>5,000 chars)', async () => {
      const hugeQuery = 'A'.repeat(5000);
      const res = await app.inject({
        method: 'GET',
        url: `/api/public/track/${hugeQuery}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('2.4 Invalid tracking query on /api/shipments/track/:trackingOrVin returns 404 without crashing', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/shipments/track/COMPLETELY_NON_EXISTENT_TRACKING_ID_99999',
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.error).toBe('Not Found');
    });

    it('2.5 Public statistics endpoint handles zero crash or data integrity issues', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/public/statistics',
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data).toHaveProperty('clearedVehiclesTotal');
      expect(data).toHaveProperty('activeShipmentsTotal');
      expect(data).toHaveProperty('portCongestion');
      expect(Array.isArray(data.portCongestion)).toBe(true);
      expect(data.portCongestion.length).toBe(4);
    });
  });

  // =========================================================================
  // 3. CUSTOMS DUTY CALCULATION BOUNDARY VALUE STRESS TESTING
  // =========================================================================
  describe('3. Customs Calculation Boundary Value Tests', () => {
    it('3.1 Zero CIF Value - should return 0 duties without NaN or division-by-zero errors', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          cifValue: 0,
          vehicleCategory: 'PASSENGER_ICE',
          engineDisplacementCc: 1500,
          fuelType: 'PETROL',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.cifUsd).toBe(0);
      expect(data.cifEtb).toBe(0);
      expect(data.dutyAmount).toBe(0);
      expect(data.exciseAmount).toBe(0);
      expect(data.vatAmount).toBe(0);
      expect(data.surtaxAmount).toBe(0);
      expect(data.withholdingAmount).toBe(0);
      expect(data.totalPayable).toBe(0);
      expect(data.effectiveTaxRatePercent).toBe(0);
      expect(Number.isNaN(data.effectiveTaxRatePercent)).toBe(false);
    });

    it('3.2 Zero components (fob=0, freight=0, insurance=0) handles gracefully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          fobUsd: 0,
          freightUsd: 0,
          insuranceUsd: 0,
          vehicleCategory: 'ELECTRIC_VEHICLE',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.cifEtb).toBe(0);
      expect(data.totalPayable).toBe(0);
    });

    it('3.3 Negative components (fobUsd: -5000) are clamped to 0 without negative duties', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          fobUsd: -5000,
          freightUsd: -1000,
          insuranceUsd: -200,
          vehicleCategory: 'PASSENGER_ICE',
          engineDisplacementCc: 1500,
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.cifUsd).toBe(0);
      expect(data.totalPayable).toBe(0);
    });

    it('3.4 Extreme engine displacement (>6000cc, e.g. 8000cc) maps to highest bracket (100% excise)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          fobUsd: 150000,
          freightUsd: 5000,
          insuranceUsd: 1000,
          vehicleCategory: 'PASSENGER_ICE',
          engineDisplacementCc: 8000, // Bugatti 8.0L W16
          fuelType: 'PETROL',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.exciseRate).toBe(1.00); // 100%
      expect(data.dutyRate).toBe(0.35); // 35%
      expect(data.hsCode).toBe('8703.23.90');
      expect(data.totalDutiesAndTaxesEtb).toBeGreaterThan(data.cifEtb * 2);
    });

    it('3.5 Massive displacement (50,000cc marine/locomotive) handles without numeric overflow', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          cifValue: 100000,
          engineDisplacementCc: 50000,
          vehicleCategory: 'PASSENGER_ICE',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.exciseRate).toBe(1.00);
      expect(Number.isFinite(data.totalPayable)).toBe(true);
    });

    it('3.6 Unsupported vehicle categories and fuel types safely fallback to default ICE without crashing', async () => {
      const weirdInputs = [
        { vehicleCategory: 'SPACESHIP_ALIEN_VESSEL', fuelType: 'ROCKET_FUEL' },
        { vehicleCategory: 'NUCLEAR_SUBMARINE', fuelType: 'URANIUM_235' },
        { vehicleCategory: '', fuelType: '' },
      ];

      for (const input of weirdInputs) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/customs/calculate',
          payload: {
            cifValue: 25000,
            engineDisplacementCc: 2000,
            vehicleCategory: input.vehicleCategory,
            fuelType: input.fuelType,
          },
        });

        expect(res.statusCode).toBe(200);
        const data = JSON.parse(res.payload);
        expect(data.dutyRate).toBe(0.35); // Default passenger ICE
        expect(data.surtaxRate).toBe(0.10);
        expect(data.vatRate).toBe(0.15);
      }
    });

    it('3.7 Missing all value fields throws 400 Calculation Error', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          engineDisplacementCc: 2000,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error).toBe('Calculation Error');
      expect(body.message).toContain('must be provided');
    });

    it('3.8 Invalid types in calculation schema throw 400 Bad Request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customs/calculate',
        payload: {
          cifValue: 'NOT_A_NUMBER' as any,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error).toBe('Bad Request');
    });
  });

  // =========================================================================
  // 4. OCR SIMULATION STRESS & ROBUSTNESS TESTING
  // =========================================================================
  describe('4. OCR Simulation Stress Tests', () => {
    it('4.1 Empty rawText string returns valid simulated result with fallback template', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/documents/ocr-scan',
        payload: { rawText: '' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.confidence).toBeGreaterThan(0.9);
      expect(body.extractedData).toBeDefined();
      expect(body.extractedData.vin.value).toBeDefined();
      expect(body.extractedData.make.value).toBeDefined();
    });

    it('4.2 Whitespace, tabs and linebreaks handled cleanly', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/documents/ocr-scan',
        payload: { rawText: '   \r\n\t\n   \t  \r\n' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.extractedData.vin.value).toBeDefined();
    });

    it('4.3 Corrupted unicode, control characters and binary escape strings handled without error', async () => {
      const corruptedStrings = [
        '\u0000\u0001\u0002\u001F\uFFFD\uD83D\uDE00',
        '???!!!@@@###$$$%%%^^^&&&***()_+',
        'مرحبا بالعالم \u0627\u0644\u0639\u0631\u0628\u064A\u0629 中文测试 🇪🇹 🚗 ⚡',
      ];

      for (const text of corruptedStrings) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/documents/ocr-scan',
          payload: { rawText: text },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.success).toBe(true);
        expect(body.extractedData).toHaveProperty('vin');
      }
    });

    it('4.4 Massive rawText payload (100,000 characters) parsed without ReDoS or timeout', async () => {
      const start = Date.now();
      const largeText = 'REPETITIVE COMMERCIAL INVOICE TEXT LINE DATA '.repeat(2500); // ~112,500 chars

      const res = await app.inject({
        method: 'POST',
        url: '/api/documents/ocr-scan',
        payload: { rawText: largeText },
      });

      const elapsedMs = Date.now() - start;
      expect(res.statusCode).toBe(200);
      expect(elapsedMs).toBeLessThan(1000); // Sub-second execution
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
    });

    it('4.5 Corrupted templateType values rejected by schema validation with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/documents/ocr-scan',
        payload: { templateType: 'MALICIOUS_INJECTION_TYPE' as any },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).error).toBe('Bad Request');
    });
  });

  // =========================================================================
  // 5. DATA INTEGRITY & AUDIT HASH-CHAIN VERIFICATION
  // =========================================================================
  describe('5. Audit Trail & Cryptographic Integrity', () => {
    it('5.1 Cryptographic audit hash chain across all seeded shipments is valid', async () => {
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

    it('5.2 Single shipment audit chain verification is valid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/verify/${sampleShipmentId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.valid).toBe(true);
      expect(body.totalLogs).toBeGreaterThan(0);
    });

    it('5.3 Invalid shipment stage string is rejected with 400 Bad Request', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/shipments/${sampleShipmentId}/stage`,
        headers: { Authorization: `Bearer ${adminToken}` },
        payload: { stage: 'NON_EXISTENT_STAGE_NAME' },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).error).toBe('Bad Request');
    });
  });
});
