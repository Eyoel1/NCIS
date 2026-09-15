import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const asycudaSyncSchema = z.object({
  declarationId: z.string().optional(),
  shipmentId: z.string().optional(),
  declarantTin: z.string().optional(),
  importerTin: z.string().optional(),
  customsOffice: z.string().optional(),
  vin: z.string().optional(),
  engineCc: z.number().optional(),
  cifEtb: z.number().optional(),
  dutyTotalEtb: z.number().optional(),
});

const bankLcSchema = z.object({
  lcNumber: z.string(),
  importerTin: z.string().optional(),
  importerAccountNumber: z.string().optional(),
  invoiceAmountUsd: z.number().optional(),
  totalDutiesAndTaxesEtb: z.number().optional(),
  vin: z.string().optional(),
});

const inspectionSchema = z.object({
  vin: z.string(),
  engineNumber: z.string().optional(),
  stationCode: z.string().optional(),
  inspectorId: z.string().optional(),
  vehicleCategory: z.string().optional(),
  fuelType: z.string().optional(),
  mileageKm: z.number().optional(),
});

export const externalRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/external/customs/asycuda-sync - ASYCUDA World Selectivity Engine
  fastify.post('/customs/asycuda-sync', async (request, reply) => {
    const parsed = asycudaSyncSchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const { cifEtb, engineCc, declarantTin } = parsed.data;

    // Selectivity rules
    let channel: 'GREEN' | 'YELLOW' | 'RED' = 'YELLOW';
    let description = 'Documentary inspection required. Yellow channel assigned.';

    if (declarantTin === '0048192031' || (cifEtb && cifEtb < 3000000 && (!engineCc || engineCc <= 1500))) {
      channel = 'GREEN';
      description = 'Direct release authorized. Authorized Economic Operator / low risk profile.';
    } else if ((cifEtb && cifEtb > 8000000) || (engineCc && engineCc > 3500)) {
      channel = 'RED';
      description = 'Physical examination and engine serial verification required at dry port ramp.';
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const asycudaReferenceNumber = `ASY-MODJO-2026-R-${randomSuffix}`;

    return reply.status(200).send({
      status: 'SUCCESS',
      asycudaReferenceNumber,
      syncTimestamp: new Date().toISOString(),
      clearanceChannel: channel,
      channelDescription: description,
      assignedAssessor: {
        officerId: 'ECC-OFF-4891',
        officerName: 'Hiwot Girma / Tesfaye Hailemariam',
        station: 'Modjo Dry Port Customs Station',
      },
      electronicReleaseOrderIssued: channel === 'GREEN',
    });
  });

  // GET /api/external/port/congestion - Live port and dry port congestion
  fastify.get('/port/congestion', async (request, reply) => {
    const query = request.query as { portCode?: string };

    const ports = [
      {
        portId: 'DJI_DCT',
        portCode: 'DJI_DCT',
        name: 'Doraleh Container Terminal (Port of Djibouti)',
        country: 'Djibouti',
        berthWaitingHours: 28.5,
        yardOccupancyPercent: 78.4,
        dwellDays: 4.2,
        congestionLevel: 'MODERATE',
        inboundVesselsAtAnchorage: 6,
        gateTruckTurnaroundMinutes: 45,
        railwayServiceActive: true,
      },
      {
        portId: 'SOM_BER',
        portCode: 'SOM_BER',
        name: 'DP World Berbera Port Terminal',
        country: 'Somaliland / Somalia',
        berthWaitingHours: 12.0,
        yardOccupancyPercent: 42.5,
        dwellDays: 2.8,
        congestionLevel: 'LOW',
        inboundVesselsAtAnchorage: 2,
        gateTruckTurnaroundMinutes: 30,
        railwayServiceActive: false,
      },
      {
        portId: 'ETH_MODJO',
        portCode: 'ETH_MODJO',
        name: 'Modjo Multi-Modal Dry Port Terminal',
        country: 'Ethiopia',
        berthWaitingHours: 0,
        yardOccupancyPercent: 82.0,
        dwellDays: 3.1,
        congestionLevel: 'HIGH',
        inboundVesselsAtAnchorage: 0,
        gateTruckTurnaroundMinutes: 65,
        railwayServiceActive: true,
      },
      {
        portId: 'ETH_KALITY',
        portCode: 'ETH_KALITY',
        name: 'Addis Ababa Kality Inland Container Terminal',
        country: 'Ethiopia',
        berthWaitingHours: 0,
        yardOccupancyPercent: 68.5,
        dwellDays: 2.4,
        congestionLevel: 'MODERATE',
        inboundVesselsAtAnchorage: 0,
        gateTruckTurnaroundMinutes: 40,
        railwayServiceActive: false,
      },
    ];

    if (query.portCode) {
      const targetCode = query.portCode.toUpperCase();
      const found = ports.find((p) => p.portCode === targetCode);
      if (found) {
        return reply.status(200).send({ port: found, timestamp: new Date().toISOString() });
      }
    }

    return reply.status(200).send({
      ports,
      totalPortsMonitored: ports.length,
      timestamp: new Date().toISOString(),
      corridorRecommendation: 'Ethio-Djibouti standard gauge railway operating normally on schedule.',
    });
  });

  // GET /api/external/port/vessel-status - Vessel AIS tracking & offload status
  fastify.get('/port/vessel-status', async (request, reply) => {
    const vessels = [
      {
        vesselName: 'M/V Shebelle',
        imoNumber: '9348192',
        shippingLine: 'ESLSE (Ethiopian Shipping & Logistics)',
        flag: 'Ethiopia',
        currentLocation: {
          latitude: 11.595,
          longitude: 43.148,
          zone: 'Port of Djibouti Quay 2',
        },
        berthStatus: 'BERTHED',
        berthNumber: 'DCT-Berth-02',
        eta: '2026-09-12T14:00:00Z',
        actualTimeOfBerthing: '2026-09-12T14:30:00Z',
        containerOffloadStatus: {
          totalContainersOnboard: 1850,
          dischargedContainers: 1850,
          dischargeProgressPercent: 100.0,
          targetContainerDischarged: true,
        },
      },
      {
        vesselName: 'Maersk Mc-Kinney Moller',
        imoNumber: '9619907',
        shippingLine: 'Maersk Line',
        flag: 'Denmark',
        currentLocation: {
          latitude: 12.15,
          longitude: 44.5,
          zone: 'Gulf of Aden / Red Sea Approach',
        },
        berthStatus: 'EN_ROUTE',
        berthNumber: 'DCT-Berth-03',
        eta: '2026-09-20T16:00:00Z',
        actualTimeOfBerthing: null,
        containerOffloadStatus: {
          totalContainersOnboard: 3840,
          dischargedContainers: 0,
          dischargeProgressPercent: 0.0,
          targetContainerDischarged: false,
        },
      },
      {
        vesselName: 'Morning Crown',
        imoNumber: '9283918',
        shippingLine: 'EUKOR Car Carriers',
        flag: 'Panama',
        currentLocation: {
          latitude: 11.595,
          longitude: 43.148,
          zone: 'Doraleh Container Terminal Quay 3',
        },
        berthStatus: 'BERTHED',
        berthNumber: 'DCT-Berth-03',
        eta: '2026-09-14T08:00:00Z',
        actualTimeOfBerthing: '2026-09-14T07:45:00Z',
        containerOffloadStatus: {
          totalContainersOnboard: 1200,
          dischargedContainers: 684,
          dischargeProgressPercent: 57.0,
          targetContainerDischarged: true,
        },
      },
    ];

    return reply.status(200).send({ vessels, count: vessels.length, timestamp: new Date().toISOString() });
  });

  // POST /api/external/bank/lc-validation - Commercial Bank of Ethiopia (CBE) L/C & Duty Debit
  fastify.post('/bank/lc-validation', async (request, reply) => {
    const parsed = bankLcSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const { lcNumber, totalDutiesAndTaxesEtb } = parsed.data;
    const txRef = `CBE-ET-TX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    return reply.status(200).send({
      status: 'APPROVED',
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      lcNumber,
      fxPermitNumber: `NBE-FX-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      lcMarginStatus: '100_PERCENT_CASH_COVERED',
      dutyPaymentSettlement: {
        transactionReference: txRef,
        debitedAccount: '10001892***19',
        beneficiary: 'Ministry of Revenues - ECC Revenue Account',
        amountDebitedEtb: totalDutiesAndTaxesEtb || 0,
        settlementTimestamp: new Date().toISOString(),
      },
      bankApprovalToken: `BANK-AUTH-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    });
  });

  // POST /api/external/inspection/roadworthiness-report - MOTL / FTA Roadworthiness Test
  fastify.post('/inspection/roadworthiness-report', async (request, reply) => {
    const parsed = inspectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const { vin, fuelType } = parsed.data;
    const certNum = `RWC-FTA-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const isEv = fuelType === 'ELECTRIC';

    return reply.status(200).send({
      inspectionCertificateNumber: certNum,
      vin,
      passed: true,
      score: 96.5,
      inspectionDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      stationName: 'Addis Ababa Kality Central Inspection Station',
      diagnosticResults: {
        emissionsStandard: isEv ? 'EV_ZERO_EMISSION' : 'EURO_V_COMPLIANT',
        chassisFrameIntegrityScore: 99.2,
        brakeEfficiencyPercent: 94.5,
        headlightAlignmentPass: true,
        speedLimiterInstalled: false,
        speedLimiterRequired: false,
      },
      qrVerificationUrl: `https://fta.gov.et/verify/${certNum}`,
      digitalInspectorSignature: `SHA256:4d10${Math.random().toString(16).substring(2, 10)}882e`,
    });
  });
};
