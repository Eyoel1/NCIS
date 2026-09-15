import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('External Mock Gateways & OCR Document REST API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/external/customs/asycuda-sync - should evaluate risk selectivity lane', async () => {
    // Green Lane test
    const greenRes = await app.inject({
      method: 'POST',
      url: '/api/external/customs/asycuda-sync',
      payload: {
        declarantTin: '0048192031', // Known AEO
        cifEtb: 1500000.0,
        engineCc: 1200,
      },
    });

    expect(greenRes.statusCode).toBe(200);
    const greenData = JSON.parse(greenRes.payload);
    expect(greenData.status).toBe('SUCCESS');
    expect(greenData.clearanceChannel).toBe('GREEN');
    expect(greenData.electronicReleaseOrderIssued).toBe(true);

    // Red Lane test
    const redRes = await app.inject({
      method: 'POST',
      url: '/api/external/customs/asycuda-sync',
      payload: {
        cifEtb: 12000000.0, // High valuation
        engineCc: 4500, // Large engine
      },
    });

    expect(redRes.statusCode).toBe(200);
    const redData = JSON.parse(redRes.payload);
    expect(redData.clearanceChannel).toBe('RED');
    expect(redData.channelDescription).toContain('Physical examination');
  });

  it('GET /api/external/port/congestion - should return port dwell and yard metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/external/port/congestion',
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.ports.length).toBeGreaterThanOrEqual(4);

    const djibouti = data.ports.find((p: any) => p.portCode === 'DJI_DCT');
    expect(djibouti).toBeDefined();
    expect(djibouti.yardOccupancyPercent).toBeGreaterThan(50);
    expect(djibouti.dwellDays).toBeGreaterThan(0);
  });

  it('GET /api/external/port/vessel-status - should return active maritime vessels', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/external/port/vessel-status',
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.vessels.length).toBeGreaterThan(0);
    expect(data.vessels[0]).toHaveProperty('vesselName');
    expect(data.vessels[0]).toHaveProperty('currentLocation');
  });

  it('POST /api/external/bank/lc-validation - should validate CBE Letter of Credit and debit taxes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/external/bank/lc-validation',
      payload: {
        lcNumber: 'LC/CBE/2026/09481',
        totalDutiesAndTaxesEtb: 12164490.0,
        importerTin: '0019482716',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.status).toBe('APPROVED');
    expect(data.bankName).toContain('Commercial Bank of Ethiopia');
    expect(data.dutyPaymentSettlement.amountDebitedEtb).toBe(12164490.0);
    expect(data.dutyPaymentSettlement.transactionReference).toMatch(/^CBE-ET-TX-2026-/);
  });

  it('POST /api/external/inspection/roadworthiness-report - should test vehicle and issue certificate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/external/inspection/roadworthiness-report',
      payload: {
        vin: 'JTEBU5JR8K5019821',
        fuelType: 'DIESEL',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.passed).toBe(true);
    expect(data.inspectionCertificateNumber).toMatch(/^RWC-FTA-2026-/);
    expect(data.diagnosticResults.brakeEfficiencyPercent).toBeGreaterThan(80);
    expect(data.diagnosticResults.emissionsStandard).toBe('EURO_V_COMPLIANT');
  });

  it('POST /api/documents/ocr-scan - should simulate OCR scanning and extract 21 domain fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/documents/ocr-scan',
      payload: {
        templateType: 'INVOICE',
        rawText: 'TOYOTA PRADO 2025 JTEBU5JR8K5123894 DISP: 2755 CC FOB: $38,500.00 JAFZA DUBAI',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.success).toBe(true);
    expect(data.confidence).toBeGreaterThan(0.9);

    const fields = data.extractedData;
    expect(fields.vin.value).toBe('JTEBU5JR8K5123894');
    expect(fields.make.value).toBe('Toyota');
    expect(fields.fobPrice.value).toBe(38500);
    expect(fields.consigneeName.value).toBeDefined();
    expect(fields.billOfLadingNumber.value).toBeDefined();
    expect(fields.containerNumber.value).toBeDefined();
    expect(fields.vin.boundingBox).toBeDefined();
  });
});
