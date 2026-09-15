import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuditLoggerService } from '../src/services/audit-logger.service';

const defaultPrisma = new PrismaClient();

export async function seed(client?: PrismaClient) {
  const prisma = client || defaultPrisma;
  console.log('Clearing existing database records...');
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.inspectionRecord.deleteMany();
  await prisma.customsDeclaration.deleteMany();
  await prisma.document.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.externalSimulationState.deleteMany();

  const passwordHash = bcrypt.hashSync('Demo@2026!', 10);

  console.log('Seeding 8 demo institutional stakeholder accounts...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@ncis.gov.et',
        passwordHash,
        fullName: 'Abebe Bekele',
        role: 'SUPER_ADMIN',
        organization: 'National Logistics Council / NCIS PMO',
        phone: '+251 911 202601',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'importer@ethioimport.com',
        passwordHash,
        fullName: 'Dawit Haile',
        role: 'IMPORTER_SUPPLIER',
        organization: 'Ethio-Red Sea Motors PLC',
        phone: '+251 911 202602',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'shipping@ethiopian-shipping.com',
        passwordHash,
        fullName: 'Captain Yared Tadesse',
        role: 'SHIPPING_COMPANY',
        organization: 'Ethiopian Shipping & Logistics Services Enterprise (ESLSE)',
        phone: '+251 911 202603',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'port@djibouti-port.com',
        passwordHash,
        fullName: 'Moustapha Omar',
        role: 'PORT_OPERATOR',
        organization: 'Société de Gestion du Port de Djibouti (DCT)',
        phone: '+253 21 35 2026',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customs@ecc.gov.et',
        passwordHash,
        fullName: 'Hiwot Girma',
        role: 'CUSTOMS_AUTHORITY',
        organization: 'Ethiopian Customs Commission (Modjo Branch)',
        phone: '+251 911 202605',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'forwarder@ethio-transit.com',
        passwordHash,
        fullName: 'Solomon Getachew',
        role: 'TRANSPORT_FORWARDER',
        organization: 'Trans-Ethiopia Freight Forwarding S.C.',
        phone: '+251 911 202606',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'cbe.finance@cbe.com.et',
        passwordHash,
        fullName: 'Selamawit Desta',
        role: 'FINANCIAL_INSURANCE',
        organization: 'Commercial Bank of Ethiopia - Trade Finance Division',
        phone: '+251 911 202607',
        demoTwoFactorBypass: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'fta@motl.gov.et',
        passwordHash,
        fullName: 'Eng. Birhanu Alemu',
        role: 'VEHICLE_REGISTRATION',
        organization: 'Federal Transport Authority / Ministry of Transport & Logistics',
        phone: '+251 911 202608',
        demoTwoFactorBypass: true,
      },
    }),
  ]);

  const [adminUser, importerUser, shippingUser, portUser, customsUser, forwarderUser, financeUser, ftaUser] = users;

  console.log('Seeding external simulation states...');
  await prisma.externalSimulationState.createMany({
    data: [
      {
        key: 'ASYCUDA_CUSTOMS',
        status: 'OPERATIONAL',
        dataJson: JSON.stringify({
          system: 'ASYCUDA World Ethiopia v4.3',
          activeOffice: 'ET-010-MODJO',
          connectedDeclarantCount: 428,
          averageSelectivityTimeMs: 320,
          greenLanePercent: 62.5,
          yellowLanePercent: 27.5,
          redLanePercent: 10.0,
        }),
      },
      {
        key: 'PORT_DJIBOUTI_TOS',
        status: 'OPERATIONAL',
        dataJson: JSON.stringify({
          terminal: 'Doraleh Container Terminal (Port of Djibouti)',
          berthOccupancyPercent: 78.4,
          yardUtilizationPercent: 72.1,
          vesselWaitingHoursAverage: 28.5,
          activeGantryCranes: 8,
          dwellDays: 4.2,
        }),
      },
      {
        key: 'PORT_BERBERA_TOS',
        status: 'OPERATIONAL',
        dataJson: JSON.stringify({
          terminal: 'DP World Berbera Port Terminal',
          berthOccupancyPercent: 48.0,
          yardUtilizationPercent: 42.5,
          vesselWaitingHoursAverage: 12.0,
          dwellDays: 2.8,
        }),
      },
      {
        key: 'CBE_BANK_GATEWAY',
        status: 'OPERATIONAL',
        dataJson: JSON.stringify({
          bank: 'Commercial Bank of Ethiopia (CBE)',
          tradePortalStatus: 'ONLINE',
          fxRateUsdToEtb: 125.50,
          dailySettledDeclarationsCount: 184,
          liquidityStatus: 'STABLE',
        }),
      },
      {
        key: 'MOTL_INSPECTION_API',
        status: 'OPERATIONAL',
        dataJson: JSON.stringify({
          authority: 'Ministry of Transport & Logistics (MOTL/FTA)',
          inspectionSystem: 'National Vehicle Inspection Database',
          testingStationsCount: 14,
          dailyPassedInspectionsCount: 112,
        }),
      },
    ],
  });

  console.log('Seeding 5 realistic Ethiopian vehicle import shipments...');

  // Shipment 1: Toyota Hilux at Modjo Dry Port (Stage 4: CUSTOMS)
  const shp1 = await prisma.shipment.create({
    data: {
      trackingNumber: 'ET-SHP-2026-001',
      title: 'Commercial Fleet Import: Toyota Hilux Double Cab 2.4L Diesel',
      billOfLadingNumber: 'ESLSE-BL-2026-9042',
      originPort: 'Port of Nagoya, Japan',
      transitPort: 'Port of Djibouti',
      destinationPort: 'Modjo Dry Port',
      currentStage: 'CUSTOMS',
      status: 'CUSTOMS_INSPECTION',
      importerId: importerUser.id,
      delayRiskRating: 'LOW',
      estimatedArrival: new Date('2026-09-18T10:00:00Z'),
      actualArrival: new Date('2026-09-12T14:30:00Z'),
      containerNumber: 'ESLU-481920-3',
      vesselName: 'M/V Shebelle',
      shippingLine: 'ESLSE',
      voyageNumber: 'SB-2026-04',
      currentLocationName: 'Modjo Dry Port Customs Yard',
      currentLatitude: 8.594,
      currentLongitude: 39.118,
      notes: 'Declaration filed via ASYCUDA. Physical inspection assigned under Yellow channel.',
    },
  });

  const veh1 = await prisma.vehicle.create({
    data: {
      shipmentId: shp1.id,
      vin: 'JTEBU5JR8K5019821',
      make: 'Toyota',
      model: 'Hilux Double Cab 2.4L Diesel 4x4',
      year: 2025,
      engineCc: 2393,
      fuelType: 'DIESEL',
      cifValue: 3200000.00,
      color: 'Super White',
      registrationPlate: null,
      titleIssued: false,
      qrCodePayload: 'https://ncis.gov.et/track/JTEBU5JR8K5019821',
      fobPriceUsd: 22000,
      freightUsd: 3000,
      insuranceUsd: 500,
      exchangeRate: 125.50,
      chassisNumber: 'JTEBU5JR8K5019821',
      registrationStatus: 'CUSTOMS_INSPECTION',
    },
  });

  await prisma.customsDeclaration.create({
    data: {
      shipmentId: shp1.id,
      declarationNumber: 'ECC-DEC-2026-00142',
      assessedCif: 3200000.00,
      dutyAmount: 1120000.00,
      exciseAmount: 4320000.00,
      vatAmount: 1296000.00,
      surtaxAmount: 864000.00,
      withholdingAmount: 96000.00,
      totalPayable: 7696000.00,
      paymentStatus: 'PAID',
      declarantName: 'Trans-Ethiopia Freight Forwarding S.C.',
      declarantTin: '0048192031',
      customsOffice: 'Modjo Dry Port Customs Branch',
      channel: 'YELLOW',
      paymentReference: 'CBE-TX-98421049',
      paymentDate: new Date('2026-09-13T11:20:00Z'),
      clearedAt: null,
    },
  });

  await prisma.document.createMany({
    data: [
      {
        shipmentId: shp1.id,
        uploaderId: importerUser.id,
        type: 'COMMERCIAL_INVOICE',
        fileName: 'Invoice_Toyota_Hilux_2025.pdf',
        filePath: '/uploads/documents/Invoice_Toyota_Hilux_2025.pdf',
        version: 1,
        status: 'VERIFIED',
        signedBy: 'Toyota Motor Corporation (Japan)',
        signedAt: new Date('2026-08-15T09:00:00Z'),
        ocrConfidenceScore: 0.98,
      },
      {
        shipmentId: shp1.id,
        uploaderId: shippingUser.id,
        type: 'BILL_OF_LADING',
        fileName: 'ESLSE_BL_9042.pdf',
        filePath: '/uploads/documents/ESLSE_BL_9042.pdf',
        version: 1,
        status: 'VERIFIED',
        signedBy: 'ESLSE Djibouti Agency',
        signedAt: new Date('2026-08-20T14:00:00Z'),
        ocrConfidenceScore: 0.97,
      },
    ],
  });

  // Shipment 2: Land Cruiser Prado at Sea (Stage 2: SHIPPING)
  const shp2 = await prisma.shipment.create({
    data: {
      trackingNumber: 'ET-SHP-2026-002',
      title: 'Executive SUV Import: Toyota Land Cruiser Prado TX-L 2.8L',
      billOfLadingNumber: 'MSK-DXB-2026-90412',
      originPort: 'Jebel Ali Port, UAE',
      transitPort: 'Port of Djibouti',
      destinationPort: 'Modjo Dry Port',
      currentStage: 'SHIPPING',
      status: 'IN_TRANSIT_SEA',
      importerId: importerUser.id,
      delayRiskRating: 'LOW',
      estimatedArrival: new Date('2026-09-20T16:00:00Z'),
      containerNumber: 'MSKU-784910-2',
      vesselName: 'Maersk Mc-Kinney Moller',
      shippingLine: 'Maersk Line',
      voyageNumber: '2608W',
      currentLocationName: 'Gulf of Aden / Red Sea Approach',
      currentLatitude: 12.15,
      currentLongitude: 44.50,
      notes: 'Vessel on schedule cruising at 18.5 knots towards Doraleh Container Terminal.',
    },
  });

  await prisma.vehicle.create({
    data: {
      shipmentId: shp2.id,
      vin: 'JTEBU5JR8K5123894',
      make: 'Toyota',
      model: 'Land Cruiser Prado TX-L 2.8L Diesel',
      year: 2025,
      engineCc: 2755,
      fuelType: 'DIESEL',
      cifValue: 5058000.00,
      color: 'Pearl White',
      registrationPlate: null,
      titleIssued: false,
      qrCodePayload: 'https://ncis.gov.et/track/JTEBU5JR8K5123894',
      fobPriceUsd: 38500,
      freightUsd: 3200,
      insuranceUsd: 450,
      exchangeRate: 120.00,
      chassisNumber: 'JTEBU5JR8K5123894',
      registrationStatus: 'PENDING_IMPORT',
    },
  });

  await prisma.document.create({
    data: {
      shipmentId: shp2.id,
      uploaderId: importerUser.id,
      type: 'COMMERCIAL_INVOICE',
      fileName: 'Invoice_TTC_Prado_2025.pdf',
      filePath: '/uploads/documents/Invoice_TTC_Prado_2025.pdf',
      version: 1,
      status: 'VERIFIED',
      signedBy: 'Toyota Tsusho Corporation Middle East',
      signedAt: new Date('2026-08-25T10:00:00Z'),
      ocrConfidenceScore: 0.99,
    },
  });

  // Shipment 3: Hyundai Tucson at Djibouti Port (Stage 3: PORT_OPERATIONS)
  const shp3 = await prisma.shipment.create({
    data: {
      trackingNumber: 'ET-SHP-2026-003',
      title: 'Urban Crossover: Hyundai Tucson 2.0L Petrol',
      billOfLadingNumber: 'EUKOR-SEL-2026-44109',
      originPort: 'Busan Port, South Korea',
      transitPort: 'Port of Djibouti',
      destinationPort: 'Modjo Dry Port',
      currentStage: 'PORT_OPERATIONS',
      status: 'DISCHARGED',
      importerId: importerUser.id,
      delayRiskRating: 'MEDIUM',
      estimatedArrival: new Date('2026-09-14T08:00:00Z'),
      actualArrival: new Date('2026-09-14T07:45:00Z'),
      containerNumber: 'EUKU-918231-0',
      vesselName: 'Morning Crown',
      shippingLine: 'EUKOR Car Carriers',
      voyageNumber: 'MC-2026-09',
      currentLocationName: 'Doraleh Container Terminal Quay 3',
      currentLatitude: 11.595,
      currentLongitude: 43.148,
      notes: 'Container offloaded to yard block C-14. Awaiting railway flatbed railcar dispatch.',
    },
  });

  await prisma.vehicle.create({
    data: {
      shipmentId: shp3.id,
      vin: 'KMHJ381B2NU904123',
      make: 'Hyundai',
      model: 'Tucson 2.0L GLS Petrol',
      year: 2025,
      engineCc: 1999,
      fuelType: 'PETROL',
      cifValue: 3012000.00,
      color: 'Phantom Black',
      registrationPlate: null,
      titleIssued: false,
      qrCodePayload: 'https://ncis.gov.et/track/KMHJ381B2NU904123',
      fobPriceUsd: 22000,
      freightUsd: 2800,
      insuranceUsd: 300,
      exchangeRate: 120.00,
      chassisNumber: 'KMHJ381B2NU904123',
      registrationStatus: 'PENDING_IMPORT',
    },
  });

  await prisma.document.create({
    data: {
      shipmentId: shp3.id,
      uploaderId: shippingUser.id,
      type: 'BILL_OF_LADING',
      fileName: 'BL_EUKOR_Tucson_44109.pdf',
      filePath: '/uploads/documents/BL_EUKOR_Tucson_44109.pdf',
      version: 1,
      status: 'VERIFIED',
      signedBy: 'EUKOR Car Carriers Inc.',
      signedAt: new Date('2026-08-28T12:00:00Z'),
      ocrConfidenceScore: 0.96,
    },
  });

  // Shipment 4: Isuzu Commercial Truck in Transit to Addis (Stage 5: POST_CUSTOMS)
  const shp4 = await prisma.shipment.create({
    data: {
      trackingNumber: 'ET-SHP-2026-004',
      title: 'Commercial Cargo Fleet: Isuzu NPR Commercial Cargo Truck',
      billOfLadingNumber: 'MOL-YOK-2026-11849',
      originPort: 'Yokohama Port, Japan',
      transitPort: 'Port of Djibouti',
      destinationPort: 'Kality Dry Port, Addis Ababa',
      currentStage: 'POST_CUSTOMS',
      status: 'INLAND_TRANSIT',
      importerId: importerUser.id,
      delayRiskRating: 'LOW',
      estimatedArrival: new Date('2026-09-16T18:00:00Z'),
      actualArrival: new Date('2026-09-10T12:00:00Z'),
      containerNumber: 'MOLU-391820-4',
      vesselName: 'M/V Gibe',
      shippingLine: 'Mitsui O.S.K. Lines (MOL)',
      voyageNumber: 'GB-2026-11',
      currentLocationName: 'Awash Customs Checkpoint (A1 Highway Corridor)',
      currentLatitude: 8.985,
      currentLongitude: 40.170,
      notes: 'Customs cleared under Green lane at Modjo. Truck convoy in transit to Addis Ababa Kality terminal.',
    },
  });

  const veh4 = await prisma.vehicle.create({
    data: {
      shipmentId: shp4.id,
      vin: 'JALE6R140N7004819',
      make: 'Isuzu',
      model: 'NPR Commercial Cargo Truck',
      year: 2024,
      engineCc: 5193,
      fuelType: 'DIESEL',
      cifValue: 4440000.00,
      color: 'White / Blue Stripe',
      registrationPlate: null,
      titleIssued: false,
      qrCodePayload: 'https://ncis.gov.et/track/JALE6R140N7004819',
      fobPriceUsd: 32000,
      freightUsd: 4500,
      insuranceUsd: 500,
      exchangeRate: 120.00,
      chassisNumber: 'JALE6R140N7004819',
      registrationStatus: 'CUSTOMS_CLEARED',
    },
  });

  await prisma.customsDeclaration.create({
    data: {
      shipmentId: shp4.id,
      declarationNumber: 'ECC-DEC-2026-00088',
      assessedCif: 4440000.00,
      dutyAmount: 444000.00,
      exciseAmount: 0.00,
      vatAmount: 732600.00,
      surtaxAmount: 0.00,
      withholdingAmount: 133200.00,
      totalPayable: 1309800.00,
      paymentStatus: 'PAID',
      declarantName: 'Trans-Ethiopia Freight Forwarding S.C.',
      declarantTin: '0048192031',
      customsOffice: 'Modjo Dry Port Customs Branch',
      channel: 'GREEN',
      paymentReference: 'CBE-TX-91024810',
      paymentDate: new Date('2026-09-11T09:30:00Z'),
      clearedAt: new Date('2026-09-11T16:00:00Z'),
    },
  });

  // Shipment 5: BYD Atto 3 EV (Stage 1: PRE_IMPORT)
  const shp5 = await prisma.shipment.create({
    data: {
      trackingNumber: 'ET-SHP-2026-005',
      title: 'Clean Energy Initiative: BYD Atto 3 Electric Vehicle',
      billOfLadingNumber: 'COSCO-SZX-2026-55018',
      originPort: 'Shenzhen Port, China',
      transitPort: 'Port of Berbera',
      destinationPort: 'Modjo Dry Port',
      currentStage: 'PRE_IMPORT',
      status: 'LC_APPROVED',
      importerId: importerUser.id,
      delayRiskRating: 'LOW',
      estimatedArrival: new Date('2026-10-05T12:00:00Z'),
      containerNumber: 'COSU-829104-9',
      vesselName: 'COSCO Shipping Pisces',
      shippingLine: 'COSCO Shipping',
      voyageNumber: 'CP-2026-07',
      currentLocationName: 'Commercial Bank of Ethiopia Head Office (Addis Ababa)',
      currentLatitude: 9.018,
      currentLongitude: 38.752,
      notes: 'Letter of Credit 100% cash covered. Zero-emission EV incentive applied.',
    },
  });

  await prisma.vehicle.create({
    data: {
      shipmentId: shp5.id,
      vin: 'LGXCE4CB4P0198274',
      make: 'BYD',
      model: 'Atto 3 Electric SUV',
      year: 2025,
      engineCc: 0,
      fuelType: 'ELECTRIC',
      cifValue: 2814000.00,
      color: 'Skiing White',
      registrationPlate: null,
      titleIssued: false,
      qrCodePayload: 'https://ncis.gov.et/track/LGXCE4CB4P0198274',
      fobPriceUsd: 21000,
      freightUsd: 2200,
      insuranceUsd: 250,
      exchangeRate: 120.00,
      chassisNumber: 'LGXCE4CB4P0198274',
      registrationStatus: 'PENDING_IMPORT',
    },
  });

  await prisma.document.create({
    data: {
      shipmentId: shp5.id,
      uploaderId: financeUser.id,
      type: 'BANK_LC',
      fileName: 'CBE_LC_2026_09481.pdf',
      filePath: '/uploads/documents/CBE_LC_2026_09481.pdf',
      version: 1,
      status: 'VERIFIED',
      signedBy: 'Commercial Bank of Ethiopia Trade Finance Dept',
      signedAt: new Date('2026-09-08T15:00:00Z'),
      ocrConfidenceScore: 0.99,
    },
  });

  console.log('Seeding sample dispute ticket...');
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'DISP-2026-0012',
      shipmentId: shp1.id,
      creatorId: importerUser.id,
      assignedRole: 'CUSTOMS_AUTHORITY',
      title: 'Clarification on Engine CC Valuation for Toyota Hilux',
      category: 'VALUATION_DISPUTE',
      priority: 'MEDIUM',
      status: 'OPEN',
    },
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket1.id,
        senderId: importerUser.id,
        message: 'Dear Customs Office, the manufacturer certificate states 2393 cc. Please verify that the 100% excise bracket is applicable rather than commercial cargo rate.',
      },
      {
        ticketId: ticket1.id,
        senderId: customsUser.id,
        message: 'Received. Customs Valuation Officer Hiwot Girma is cross-referencing against the manufacturer price catalog and physical chassis stamping.',
      },
    ],
  });

  console.log('Generating cryptographically chained audit logs...');
  const shipments = [shp1, shp2, shp3, shp4, shp5];
  for (const s of shipments) {
    await AuditLoggerService.recordLog(prisma, {
      shipmentId: s.id,
      actorId: importerUser.id,
      actorRole: 'IMPORTER_SUPPLIER',
      actorName: importerUser.fullName,
      action: 'SHIPMENT_INITIALIZED',
      stage: 'PRE_IMPORT',
      details: `Shipment ${s.trackingNumber} initialized by importer ${importerUser.fullName}.`,
      newStateJson: { trackingNumber: s.trackingNumber, title: s.title, stage: 'PRE_IMPORT' },
    });

    if (s.currentStage !== 'PRE_IMPORT') {
      await AuditLoggerService.recordLog(prisma, {
        shipmentId: s.id,
        actorId: shippingUser.id,
        actorRole: 'SHIPPING_COMPANY',
        actorName: shippingUser.fullName,
        action: 'VESSEL_DEPARTED',
        stage: 'SHIPPING',
        details: `Vessel ${s.vesselName} loaded with container ${s.containerNumber} departed origin port.`,
        newStateJson: { stage: 'SHIPPING', vessel: s.vesselName },
      });
    }

    if (['PORT_OPERATIONS', 'CUSTOMS', 'POST_CUSTOMS', 'DELIVERY'].includes(s.currentStage)) {
      await AuditLoggerService.recordLog(prisma, {
        shipmentId: s.id,
        actorId: portUser.id,
        actorRole: 'PORT_OPERATOR',
        actorName: portUser.fullName,
        action: 'CONTAINER_DISCHARGED',
        stage: 'PORT_OPERATIONS',
        details: `Container ${s.containerNumber} discharged at Port of Djibouti.`,
        newStateJson: { stage: 'PORT_OPERATIONS', status: 'DISCHARGED' },
      });
    }

    if (['CUSTOMS', 'POST_CUSTOMS', 'DELIVERY'].includes(s.currentStage)) {
      await AuditLoggerService.recordLog(prisma, {
        shipmentId: s.id,
        actorId: customsUser.id,
        actorRole: 'CUSTOMS_AUTHORITY',
        actorName: customsUser.fullName,
        action: 'CUSTOMS_ASSESSMENT_COMPLETED',
        stage: 'CUSTOMS',
        details: `Customs declaration assessed and validated under ASYCUDA.`,
        newStateJson: { stage: 'CUSTOMS', status: 'DUTY_PAID' },
      });
    }
  }

  console.log('Database seeded successfully!');
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await defaultPrisma.$disconnect();
    });
}

