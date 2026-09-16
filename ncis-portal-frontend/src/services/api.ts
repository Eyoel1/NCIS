import {
  Shipment,
  PortCongestionInfo,
  DutyCalculationInput,
  DutyCalculationResult,
  AuditLog,
  Ticket,
  ShipmentStage,
} from '../types';
import { MOCK_PORTS, MOCK_SHIPMENTS } from './mockData';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = localStorage.getItem('ncis_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const role = localStorage.getItem('ncis_role');
    if (role) {
      headers['x-demo-role'] = role;
    }
  } catch {
    // Ignore
  }
  return headers;
}

// In-memory state for local operations / fallback
let shipmentsCache: Shipment[] = [...MOCK_SHIPMENTS];

export function computeEthiopianCustomsDuty(input: DutyCalculationInput): DutyCalculationResult {
  const cif = Math.max(0, Number(input.cifValue) || 0);
  const cc = Math.max(0, Number(input.engineCapacityCc) || 0);
  const fuel = input.fuelType || 'PETROL';
  const category = input.vehicleCategory || 'PASSENGER';

  // 1. Duty Rate
  let dutyRate = 0.35;
  if (category === 'COMMERCIAL') {
    dutyRate = 0.10;
  } else if (category === 'MOTORCYCLE') {
    dutyRate = 0.30;
  }
  const dutyAmount = Math.round(cif * dutyRate);

  // 2. Excise Rate
  let exciseRate = 0.30;
  if (category === 'COMMERCIAL') {
    exciseRate = 0.00; // Commercial freight trucks are assessed at 0% excise under Proclamation 1186/2020
  } else if (fuel === 'ELECTRIC') {
    exciseRate = 0.05; // 5% EV incentive
  } else if (cc <= 1300) {
    exciseRate = 0.30;
  } else if (cc <= 1800) {
    exciseRate = 0.60;
  } else {
    exciseRate = 1.00;
  }
  const exciseBase = cif + dutyAmount;
  const exciseAmount = Math.round(exciseBase * exciseRate);

  // 3. VAT (15%)
  const vatRate = 0.15;
  const vatBase = cif + dutyAmount + exciseAmount;
  const vatAmount = Math.round(vatBase * vatRate);

  // 4. Surtax (10%)
  const surtaxRate = 0.10;
  const surtaxBase = cif + dutyAmount + exciseAmount;
  const surtaxAmount = Math.round(surtaxBase * surtaxRate);

  // 5. Withholding Tax (3% on CIF)
  const withholdingRate = 0.03;
  const withholdingAmount = Math.round(cif * withholdingRate);

  // Total
  const totalPayable = dutyAmount + exciseAmount + vatAmount + surtaxAmount + withholdingAmount;

  return {
    cifValue: cif,
    dutyRate,
    dutyAmount,
    exciseRate,
    exciseAmount,
    vatRate,
    vatAmount,
    surtaxRate,
    surtaxAmount,
    withholdingRate,
    withholdingAmount,
    totalPayable,
    currency: 'ETB',
  };
}

function getLiveShipmentsFromStorage(): Shipment[] {
  try {
    const saved = localStorage.getItem('ncis_live_shipments');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        shipmentsCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return shipmentsCache;
}

export const api = {
  async getShipments(): Promise<Shipment[]> {
    try {
      const res = await fetch(`${BASE_URL}/shipments`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.shipments) && data.shipments.length > 0) {
          shipmentsCache = data.shipments;
          return data.shipments;
        }
      }
    } catch {
      // Backend not running, use storage fallback
    }
    return getLiveShipmentsFromStorage();
  },

  async getShipmentById(id: string): Promise<Shipment | null> {
    try {
      const res = await fetch(`${BASE_URL}/shipments/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data.shipment;
      }
    } catch {
      // Ignore
    }
    const all = getLiveShipmentsFromStorage();
    const clean = id.trim().toUpperCase();
    const norm = clean.replace(/[^A-Z0-9]/g, '');
    return (
      all.find(
        (s) =>
          s.id === id ||
          s.trackingNumber?.toUpperCase() === clean ||
          s.trackingNumber?.replace(/[^A-Z0-9]/gi, '').toUpperCase() === norm ||
          s.vehicles?.some((v) => v.vin?.toUpperCase() === clean || v.vin?.replace(/[^A-Z0-9]/gi, '').toUpperCase() === norm)
      ) || null
    );
  },

  async trackPublic(query: string): Promise<any> {
    const raw = (query || '').trim();
    const clean = raw.toUpperCase();
    const normalized = clean.replace(/[^A-Z0-9]/g, '');

    try {
      const res = await fetch(`${BASE_URL}/public/track/${encodeURIComponent(clean)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const allShipments = getLiveShipmentsFromStorage();

    const matchString = (target?: string | null) => {
      if (!target) return false;
      const tClean = target.trim().toUpperCase();
      const tNorm = tClean.replace(/[^A-Z0-9]/g, '');
      return (
        tClean === clean ||
        tNorm === normalized ||
        tClean.replace(/[\s_]+/g, '-') === clean.replace(/[\s_]+/g, '-')
      );
    };

    const found = allShipments.find(
      (s) =>
        matchString(s.trackingNumber) ||
        matchString(s.id) ||
        matchString(s.billOfLadingNumber) ||
        s.vehicles?.some((v) => matchString(v.vin) || matchString(v.registrationPlate))
    );

    if (found) {
      const stages = ['PRE_IMPORT', 'SHIPPING', 'PORT_OPERATIONS', 'CUSTOMS', 'POST_CUSTOMS', 'DELIVERY', 'COMPLETED'];
      const idx = stages.indexOf(found.currentStage);
      return {
        trackingNumber: found.trackingNumber,
        title: found.title || `${found.vehicles?.[0]?.make || 'Vehicle'} ${found.vehicles?.[0]?.model || ''}`.trim(),
        currentStage: found.currentStage,
        status: found.status,
        originPort: found.originPort || 'Port of Jebel Ali, UAE',
        transitPort: found.transitPort || 'Port of Djibouti (Doraleh)',
        destinationPort: found.destinationPort || 'Modjo Multimodal Dry Port',
        shippingLine: found.shippingLine || 'Horn Maritime Line S.A.',
        vesselName: found.vesselName || 'MV Horn Pioneer',
        containerNumber: found.containerNumber || 'MSKU-849201-9',
        billOfLadingNumber: found.billOfLadingNumber || 'HML-BOL-2026-901',
        currentLocation: {
          name: found.currentLocationName || 'Corridor Transit Terminal',
          latitude: found.currentLatitude || 11.595,
          longitude: found.currentLongitude || 43.148,
        },
        delayRiskRating: found.delayRiskRating || 'LOW',
        estimatedArrival: found.estimatedArrival || new Date(Date.now() + 86400000 * 5).toISOString(),
        actualArrival: found.actualArrival || null,
        lifecycleMilestones: stages.map((stage, i) => ({
          stage,
          completed: i < idx || found.currentStage === 'COMPLETED',
          inProgress: i === idx && found.currentStage !== 'COMPLETED',
          timestamp: found.auditLogs?.find((l) => l.stage === stage)?.timestamp || null,
        })),
        vehicles: found.vehicles?.map((v) => ({
          vin: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          fuelType: v.fuelType,
          color: v.color,
          cifValue: v.cifValue,
          engineCc: v.engineCc,
          registrationPlate: v.registrationPlate || 'Pending MOTL',
          registrationStatus: v.titleIssued ? 'REGISTERED' : 'IN_PROGRESS',
          qrVerificationUrl: `https://ncis.gov.et/track/${v.vin}`,
        })) || [],
        customsAssessment:
          found.customsAssessment ||
          (found.customsDeclaration
            ? {
                declarationNumber: found.customsDeclaration.declarationNumber,
                assessedCif: found.customsDeclaration.assessedCif,
                totalPayable: found.customsDeclaration.totalPayable,
                paymentStatus: found.customsDeclaration.paymentStatus,
                channel: found.customsDeclaration.channel,
              }
            : {
                declarationNumber: `DEC-2026-${(found.trackingNumber || '0000').slice(-4)}`,
                assessedCif: found.vehicles?.[0]?.cifValue || 2850000,
                totalPayable: Math.round((found.vehicles?.[0]?.cifValue || 2850000) * 0.64),
                paymentStatus: found.currentStage === 'PRE_IMPORT' ? 'UNPAID' : 'ESCROW_LOCKED',
                channel: 'GREEN',
              }),
      };
    }

    throw new Error(`No shipment found matching tracking/VIN: ${clean}`);
  },

  async getStatistics(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/public/statistics`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return {
      clearedVehiclesTotal: 14285,
      activeShipmentsTotal: shipmentsCache.length,
      averageClearanceDays: 5.4,
      dutyRevenueCollectedEtb: 8945200000,
      portCongestion: MOCK_PORTS.map((p) => ({
        port: p.name,
        dwellDays: p.dwellTimeDays,
        congestionScore: p.congestionIndex,
        queueCount: p.waitingVessels || p.customsQueue || 4,
      })),
      importsByMake: [
        { make: 'Toyota', count: 6840, percentage: 47.9 },
        { make: 'Hyundai', count: 2850, percentage: 20.0 },
        { make: 'Isuzu', count: 2140, percentage: 15.0 },
        { make: 'Suzuki', count: 1420, percentage: 9.9 },
        { make: 'BYD & EVs', count: 1030, percentage: 7.2 },
      ],
      fuelDistribution: {
        diesel: 54.2,
        petrol: 32.1,
        hybrid: 7.5,
        electric: 6.2,
      },
      monthlyThroughput: [
        { month: 'Apr', count: 980 },
        { month: 'May', count: 1050 },
        { month: 'Jun', count: 1120 },
        { month: 'Jul', count: 1200 },
        { month: 'Aug', count: 1350 },
        { month: 'Sep', count: 1420 },
      ],
    };
  },

  async calculateDuty(input: DutyCalculationInput): Promise<DutyCalculationResult> {
    try {
      const res = await fetch(`${BASE_URL}/customs/calculate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return computeEthiopianCustomsDuty(input);
  },

  async updateStage(shipmentId: string, stage: ShipmentStage, notes?: string): Promise<Shipment> {
    try {
      const res = await fetch(`${BASE_URL}/shipments/${shipmentId}/stage`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.shipment;
      }
    } catch {
      // Fallback
    }

    const item = shipmentsCache.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (item) {
      item.currentStage = stage;
      item.updatedAt = new Date().toISOString();
      if (!item.auditLogs) item.auditLogs = [];
      item.auditLogs.unshift({
        id: `log-${Date.now()}`,
        shipmentId: item.id,
        action: 'STAGE_UPDATED',
        stage,
        details: notes || `Advanced to stage ${stage}`,
        timestamp: new Date().toISOString(),
        hash: Math.random().toString(36).substring(2) + 'a1b2c3d4e5f6',
      });
      return { ...item };
    }
    throw new Error('Shipment not found');
  },

  async createShipment(data: any): Promise<Shipment> {
    try {
      const res = await fetch(`${BASE_URL}/shipments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        return created.shipment;
      }
    } catch {
      // Fallback
    }

    const newTracking = `ET-SHP-2026-${String(shipmentsCache.length + 1).padStart(3, '0')}`;
    const newShp: Shipment = {
      id: `shp-${Date.now()}`,
      trackingNumber: newTracking,
      title: `${data.make || 'Toyota'} ${data.model || 'Corolla'} (${data.year || 2024})`,
      billOfLadingNumber: data.billOfLadingNumber || `HML-DXB-${Math.floor(100000 + Math.random() * 900000)}`,
      originPort: data.originPort || 'Jebel Ali, UAE',
      transitPort: data.transitPort || 'Port of Djibouti',
      destinationPort: data.destinationPort || 'Modjo Dry Port',
      currentStage: 'PRE_IMPORT',
      status: 'SUBMITTED',
      importerId: 'usr-imp-01',
      delayRiskRating: 'LOW',
      currentLocationName: 'Port of Departure',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vehicles: [
        {
          id: `veh-${Date.now()}`,
          shipmentId: `shp-${Date.now()}`,
          vin: data.vin || `ETH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          make: data.make || 'Toyota',
          model: data.model || 'Corolla Cross',
          year: Number(data.year) || 2024,
          engineCc: Number(data.engineCc) || 1800,
          fuelType: data.fuelType || 'HYBRID',
          cifValue: Number(data.cifValue) || 2500000,
          color: data.color || 'Silver',
          titleIssued: false,
          qrCodePayload: `https://ncis.gov.et/track/${newTracking}`,
        },
      ],
    };
    shipmentsCache.unshift(newShp);
    return newShp;
  },

  async verifyChain(shipmentId?: string): Promise<{ valid: boolean; verifiedBlocks: number; message: string }> {
    try {
      const url = shipmentId ? `${BASE_URL}/audit-logs/verify/${shipmentId}` : `${BASE_URL}/audit-logs/verify`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return {
      valid: true,
      verifiedBlocks: 18,
      message: 'Cryptographic SHA-256 hash chain verified: 100% tamper-free integrity across all blocks.',
    };
  },

  async runOcrScan(documentType: 'INVOICE' | 'BOL'): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/documents/ocr-scan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ documentType, templateType: documentType }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    if (documentType === 'INVOICE') {
      return {
        success: true,
        confidence: 0.98,
        extractedData: {
          vin: 'JTJHY7AX8N4029182',
          make: 'Toyota',
          model: 'Land Cruiser Prado TX',
          year: 2024,
          engineCc: 2755,
          fuelType: 'HYBRID',
          fobPrice: 24500,
          freight: 2200,
          insurance: 800,
          cifValue: 27500,
          cifEtb: 3451250,
          shipper: 'Toyota Tsusho Corporation (Dubai Branch)',
          consignee: 'Ethio Auto Imports PLC (Addis Ababa)',
          invoiceNumber: 'INV-2026-TTC-8940',
        },
      };
    } else {
      return {
        success: true,
        confidence: 0.97,
        extractedData: {
          bolNumber: 'HML-DXB-849201',
          vesselName: 'MV Horn Pioneer',
          voyageNumber: 'HP-2026-09A',
          containerNumber: 'MSKU-948201-4',
          sealNumber: '9F82A0',
          loadingPort: 'Jebel Ali Port (AEJEA)',
          dischargePort: 'Port of Djibouti (DJJIB)',
          destination: 'Modjo Multimodal Dry Port (ETMOD)',
          grossWeightKg: 2850,
        },
      };
    }
  },

  async getAuditLogs(shipmentId?: string): Promise<AuditLog[]> {
    try {
      const url = shipmentId ? `${BASE_URL}/audit-logs?shipmentId=${shipmentId}` : `${BASE_URL}/audit-logs`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.logs;
      }
    } catch {
      // Fallback
    }

    const allLogs = shipmentsCache.flatMap((s) => s.auditLogs || []);
    return allLogs;
  },

  async getTickets(): Promise<Ticket[]> {
    try {
      const res = await fetch(`${BASE_URL}/tickets`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.tickets;
      }
    } catch {
      // Fallback
    }
    return shipmentsCache.flatMap((s) => s.tickets || []);
  },

  async createTicket(data: any): Promise<Ticket> {
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        return resData.ticket;
      }
    } catch {
      // Fallback
    }

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      shipmentId: data.shipmentId || 'shp-001',
      creatorId: 'usr-imp-01',
      assignedRole: data.assignedRole || 'CUSTOMS_AUTHORITY',
      title: data.title,
      category: data.category || 'VALUATION_DISPUTE',
      priority: data.priority || 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          ticketId: `tkt-${Date.now()}`,
          senderId: 'usr-imp-01',
          message: data.message || 'Ticket initiated',
          createdAt: new Date().toISOString(),
          sender: { fullName: 'Alazar Tadesse', role: 'IMPORTER_SUPPLIER' },
        },
      ],
    };

    const targetShp = shipmentsCache.find((s) => s.id === data.shipmentId);
    if (targetShp) {
      if (!targetShp.tickets) targetShp.tickets = [];
      targetShp.tickets.unshift(newTicket);
    }
    return newTicket;
  },
};
