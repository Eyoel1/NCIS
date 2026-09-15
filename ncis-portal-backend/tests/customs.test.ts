import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Customs Duty Engine & Declaration REST API', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@ncis.gov.et',
        password: 'Demo@2026!',
        demoBypass: true,
      },
    });
    adminToken = JSON.parse(loginRes.payload).token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Scenario 1: Small Sedan (Suzuki Dzire 1197cc) - Deterministic Tax Calculation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/customs/calculate',
      payload: {
        fobUsd: 9000,
        freightUsd: 1500,
        insuranceUsd: 150,
        exchangeRate: 120.00,
        vehicleCategory: 'PASSENGER_ICE',
        engineDisplacementCc: 1197,
        fuelType: 'PETROL',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);

    expect(data.cifUsd).toBe(10650.00);
    expect(data.cifEtb).toBe(1278000.00);
    expect(data.duty.taxAmountEtb).toBe(447300.00); // 35%
    expect(data.excise.taxAmountEtb).toBe(517590.00); // 30% of (1,278,000 + 447,300 = 1,725,300)
    expect(data.vat.taxAmountEtb).toBe(336433.50); // 15% of 2,242,890
    expect(data.surtax.taxAmountEtb).toBe(224289.00); // 10% of 2,242,890
    expect(data.withholding.taxAmountEtb).toBe(38340.00); // 3% of 1,278,000
    expect(data.totalDutiesAndTaxesEtb).toBe(1563952.50);
    expect(data.totalLandedCostEtb).toBe(2841952.50);
    expect(data.effectiveTaxRatePercent).toBe(122.37);
  });

  it('Scenario 2: Mid SUV (Toyota RAV4 1987cc) - Deterministic Tax Calculation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/customs/calculate',
      payload: {
        fobUsd: 22000,
        freightUsd: 2800,
        insuranceUsd: 300,
        exchangeRate: 120.00,
        vehicleCategory: 'PASSENGER_ICE',
        engineDisplacementCc: 1987,
        fuelType: 'PETROL',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);

    expect(data.cifUsd).toBe(25100.00);
    expect(data.cifEtb).toBe(3012000.00);
    expect(data.duty.taxAmountEtb).toBe(1054200.00); // 35%
    expect(data.excise.taxAmountEtb).toBe(4066200.00); // 100%
    expect(data.vat.taxAmountEtb).toBe(1219860.00); // 15%
    expect(data.surtax.taxAmountEtb).toBe(813240.00); // 10%
    expect(data.withholding.taxAmountEtb).toBe(90360.00); // 3%
    expect(data.totalDutiesAndTaxesEtb).toBe(7243860.00);
    expect(data.totalLandedCostEtb).toBe(10255860.00);
    expect(data.effectiveTaxRatePercent).toBe(240.50);
  });

  it('Scenario 3: Commercial Truck (Isuzu NPR >=5t) - Deterministic Tax Calculation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/customs/calculate',
      payload: {
        fobUsd: 32000,
        freightUsd: 4500,
        insuranceUsd: 500,
        exchangeRate: 120.00,
        vehicleCategory: 'COMMERCIAL_TRUCK',
        engineDisplacementCc: 5193,
        fuelType: 'DIESEL',
        grossVehicleWeightTonnes: 7.5,
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);

    expect(data.cifUsd).toBe(37000.00);
    expect(data.cifEtb).toBe(4440000.00);
    expect(data.duty.taxAmountEtb).toBe(444000.00); // 10%
    expect(data.excise.taxAmountEtb).toBe(0.00); // 0%
    expect(data.vat.taxAmountEtb).toBe(732600.00); // 15%
    expect(data.surtax.taxAmountEtb).toBe(0.00); // 0% exempt
    expect(data.withholding.taxAmountEtb).toBe(133200.00); // 3%
    expect(data.totalDutiesAndTaxesEtb).toBe(1309800.00);
    expect(data.totalLandedCostEtb).toBe(5749800.00);
    expect(data.effectiveTaxRatePercent).toBe(29.50);
  });

  it('Scenario 4: Electric Vehicle (BYD Atto 3) - Deterministic Tax Calculation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/customs/calculate',
      payload: {
        fobUsd: 21000,
        freightUsd: 2200,
        insuranceUsd: 250,
        exchangeRate: 120.00,
        vehicleCategory: 'ELECTRIC_VEHICLE',
        engineDisplacementCc: 0,
        fuelType: 'ELECTRIC',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);

    expect(data.cifUsd).toBe(23450.00);
    expect(data.cifEtb).toBe(2814000.00);
    expect(data.duty.taxAmountEtb).toBe(140700.00); // 5%
    expect(data.excise.taxAmountEtb).toBe(147735.00); // 5%
    expect(data.vat.taxAmountEtb).toBe(465365.25); // 15%
    expect(data.surtax.taxAmountEtb).toBe(310243.50); // 10%
    expect(data.withholding.taxAmountEtb).toBe(84420.00); // 3%
    expect(data.totalDutiesAndTaxesEtb).toBe(1148463.75);
    expect(data.totalLandedCostEtb).toBe(3962463.75);
    expect(data.effectiveTaxRatePercent).toBe(40.81);
  });

  it('GET /api/customs/declarations/:id/pdf - should generate Form C-30 PDF stream', async () => {
    const shipment = await app.prisma.shipment.findFirst({
      where: { customsDeclaration: { isNot: null } },
      include: { customsDeclaration: true },
    });

    expect(shipment).toBeDefined();
    expect(shipment?.customsDeclaration).toBeDefined();

    const decId = shipment!.customsDeclaration!.id;

    const res = await app.inject({
      method: 'GET',
      url: `/api/customs/declarations/${decId}/pdf`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename=');
    expect(res.rawPayload.length).toBeGreaterThan(1000); // Valid PDF binary
  });
});
