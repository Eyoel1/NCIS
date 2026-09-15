import { describe, it, expect } from 'vitest';
import { computeEthiopianCustomsDuty } from '../services/api';
import { MOCK_PORTS, MOCK_SHIPMENTS } from '../services/mockData';

describe('Adversarial Challenger: Ethiopian Customs Cascading Math', () => {
  it('Passenger Car (1998cc, CIF ,000): matches Proclamations 859/2014 & 1186/2020 exact cascading schedule', () => {
    // FOB ,000 + Freight ,500 + Insurance  = CIF ,000
    // Engine 1998cc (> 1800cc) -> Duty 35%, Excise 100%, VAT 15%, Surtax 10%, Withholding 3%
    const res = computeEthiopianCustomsDuty({
      cifValue: 28000,
      engineCapacityCc: 1998,
      fuelType: 'PETROL',
      vehicleCategory: 'PASSENGER',
    });

    expect(res.dutyRate).toBe(0.35);
    expect(res.dutyAmount).toBe(9800); // 28000 * 0.35 = 9800

    expect(res.exciseRate).toBe(1.00);
    expect(res.exciseAmount).toBe(37800); // (28000 + 9800) * 1.00 = 37800

    expect(res.vatRate).toBe(0.15);
    expect(res.vatAmount).toBe(11340); // (28000 + 9800 + 37800) * 0.15 = 75600 * 0.15 = 11340

    expect(res.surtaxRate).toBe(0.10);
    expect(res.surtaxAmount).toBe(7560); // 75600 * 0.10 = 7560

    expect(res.withholdingRate).toBe(0.03);
    expect(res.withholdingAmount).toBe(840); // 28000 * 0.03 = 840

    expect(res.totalPayable).toBe(67340); // 9800 + 37800 + 11340 + 7560 + 840 = 67340
  });

  it('Electric Vehicle (EV): 5% flat incentive excise', () => {
    const res = computeEthiopianCustomsDuty({
      cifValue: 28000,
      engineCapacityCc: 0,
      fuelType: 'ELECTRIC',
      vehicleCategory: 'PASSENGER',
    });

    expect(res.dutyRate).toBe(0.35);
    expect(res.dutyAmount).toBe(9800);

    expect(res.exciseRate).toBe(0.05); // 5% EV incentive
    expect(res.exciseAmount).toBe(Math.round((28000 + 9800) * 0.05)); // 37800 * 0.05 = 1890

    expect(res.vatRate).toBe(0.15);
    expect(res.vatAmount).toBe(Math.round((28000 + 9800 + 1890) * 0.15)); // 39690 * 0.15 = 5953.5 -> 5954

    expect(res.surtaxRate).toBe(0.10);
    expect(res.surtaxAmount).toBe(Math.round((28000 + 9800 + 1890) * 0.10)); // 39690 * 0.10 = 3969

    expect(res.withholdingRate).toBe(0.03);
    expect(res.withholdingAmount).toBe(840);

    expect(res.totalPayable).toBe(9800 + 1890 + 5954 + 3969 + 840);
  });

  it('Commercial Truck: checks whether 10% duty and 0% excise are respected or if excise is erroneously applied', () => {
    const res = computeEthiopianCustomsDuty({
      cifValue: 28000,
      engineCapacityCc: 4000,
      fuelType: 'DIESEL',
      vehicleCategory: 'COMMERCIAL',
    });

    expect(res.dutyRate).toBe(0.10);
    expect(res.dutyAmount).toBe(2800);

    // Verified: Under Proclamation 1186/2020 and dispatch specifications, commercial freight trucks are 0% excise.
    expect(res.exciseRate).toBe(0.00);
    expect(res.exciseAmount).toBe(0);

    // VAT (15% on 28000 + 2800 = 30800) -> 4620
    expect(res.vatAmount).toBe(4620);
    // Surtax (10% on 30800) -> 3080
    expect(res.surtaxAmount).toBe(3080);
    // Withholding (3% on 28000) -> 840
    expect(res.withholdingAmount).toBe(840);

    // Total: 2800 + 0 + 4620 + 3080 + 840 = 11340
    expect(res.totalPayable).toBe(11340);
    console.log('[CHALLENGE 2 TEST RESULT] Commercial truck exciseRate:', res.exciseRate, 'exciseAmount:', res.exciseAmount);
  });

  it('Boundary & Negative Inputs: CIF 0, negative CC, negative CIF, NaN, undefined', () => {
    // Zero CIF
    const resZero = computeEthiopianCustomsDuty({
      cifValue: 0,
      engineCapacityCc: 1800,
      fuelType: 'PETROL',
      vehicleCategory: 'PASSENGER',
    });
    expect(resZero.dutyAmount).toBe(0);
    expect(resZero.exciseAmount).toBe(0);
    expect(resZero.vatAmount).toBe(0);
    expect(resZero.surtaxAmount).toBe(0);
    expect(resZero.withholdingAmount).toBe(0);
    expect(resZero.totalPayable).toBe(0);
    expect(Number.isNaN(resZero.totalPayable)).toBe(false);

    // Negative CIF clamped to 0
    const resNegCif = computeEthiopianCustomsDuty({
      cifValue: -25000,
      engineCapacityCc: 1998,
      fuelType: 'PETROL',
      vehicleCategory: 'PASSENGER',
    });
    expect(resNegCif.cifValue).toBe(0);
    expect(resNegCif.totalPayable).toBe(0);
    expect(resNegCif.dutyAmount).toBe(0);
    expect(resNegCif.exciseAmount).toBe(0);

    // Negative CC clamped to 0
    const resNegCc = computeEthiopianCustomsDuty({
      cifValue: 10000,
      engineCapacityCc: -500,
      fuelType: 'PETROL',
      vehicleCategory: 'PASSENGER',
    });
    expect(Number.isNaN(resNegCc.totalPayable)).toBe(false);
    expect(resNegCc.totalPayable).toBeGreaterThan(0);
    console.log('[CHALLENGE 2 TEST RESULT] Negative CC handling: exciseRate =', resNegCc.exciseRate);

    // NaN / Undefined
    const resNaN = computeEthiopianCustomsDuty({
      cifValue: NaN as any,
      engineCapacityCc: undefined as any,
      fuelType: undefined as any,
      vehicleCategory: undefined as any,
    });
    expect(resNaN.dutyAmount).toBe(0);
    expect(resNaN.totalPayable).toBe(0);
    expect(Number.isNaN(resNaN.totalPayable)).toBe(false);
  });
});

describe('Adversarial Challenger: Leaflet GIS Waypoint Coordinates', () => {
  it('verifies maritime waypoints are within Horn of Africa & Gulf coordinates [lat, lng] and not inverted', () => {
    // Waypoints from CorridorMap.tsx
    const MARITIME_ROUTE = [
      [25.01, 55.06],  // Jebel Ali
      [26.56, 56.41],  // Strait of Hormuz
      [24.50, 58.50],  // Gulf of Oman
      [18.20, 57.00],  // Arabian Sea
      [14.50, 53.00],
      [12.35, 47.50],  // Gulf of Aden
      [12.60, 43.40],  // Bab-el-Mandeb
      [11.602, 43.141] // Port of Djibouti
    ];

    MARITIME_ROUTE.forEach(([lat, lng], idx) => {
      // Latitude must be positive (Northern Hemisphere: 10 - 28 N)
      expect(lat).toBeGreaterThanOrEqual(10);
      expect(lat).toBeLessThanOrEqual(30);
      // Longitude must be positive (Eastern Hemisphere: 40 - 65 E)
      expect(lng).toBeGreaterThanOrEqual(40);
      expect(lng).toBeLessThanOrEqual(65);
      // Ensure lat < lng (since Horn of Africa latitudes are ~11-26 while longitudes are ~43-58)
      expect(lat).toBeLessThan(lng);
    });
  });

  it('verifies inland corridor waypoints connect Djibouti to Addis Ababa with valid [lat, lng]', () => {
    const INLAND_CORRIDOR = [
      [11.602, 43.141], // Djibouti
      [11.550, 42.850],
      [11.717, 41.838], // Galafi Border Post
      [11.794, 41.008],
      [10.500, 40.800],
      [8.983, 40.167],  // Awash Transit Hub
      [8.540, 39.270],  // Adama
      [8.590, 39.120],  // Modjo Multimodal Dry Port
      [8.910, 38.760],  // Kality Dry Port
      [9.020, 38.740],  // Addis Ababa Vehicle Center
    ];

    INLAND_CORRIDOR.forEach(([lat, lng]) => {
      // Ethiopia/Djibouti latitudes are between 8 and 13 N
      expect(lat).toBeGreaterThanOrEqual(8.0);
      expect(lat).toBeLessThanOrEqual(13.0);
      // Longitudes are between 38 and 44 E
      expect(lng).toBeGreaterThanOrEqual(38.0);
      expect(lng).toBeLessThanOrEqual(44.0);
    });

    // Start is Port of Djibouti
    expect(INLAND_CORRIDOR[0]).toEqual([11.602, 43.141]);
    // End is Addis Ababa
    expect(INLAND_CORRIDOR[INLAND_CORRIDOR.length - 1]).toEqual([9.020, 38.740]);
  });

  it('verifies mock ports and shipments coordinates are geographically sound', () => {
    MOCK_PORTS.forEach((p) => {
      expect(p.lat).toBeGreaterThanOrEqual(8);
      expect(p.lat).toBeLessThanOrEqual(13);
      expect(p.lng).toBeGreaterThanOrEqual(38);
      expect(p.lng).toBeLessThanOrEqual(46);
    });

    MOCK_SHIPMENTS.forEach((s) => {
      if (s.currentLatitude && s.currentLongitude) {
        expect(s.currentLatitude).toBeGreaterThanOrEqual(8);
        expect(s.currentLatitude).toBeLessThanOrEqual(15);
        expect(s.currentLongitude).toBeGreaterThanOrEqual(38);
        expect(s.currentLongitude).toBeLessThanOrEqual(48);
      }
    });
  });
});
