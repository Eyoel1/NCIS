import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shipment, ShipmentStage, UserRole, AuditLog } from '../types';
import { MOCK_SHIPMENTS } from '../services/mockData';
import { api } from '../services/api';

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  actor: string;
  role: string;
  shipmentId?: string;
  read: boolean;
}

interface ShipmentContextType {
  shipments: Shipment[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  flashBulletin: string | null;
  activeChaosEvents: Record<string, boolean>;
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Interconnected Lifecycle Actions
  createShipment: (data: any) => Promise<Shipment>;
  authorizeFx: (shipmentId: string, bankRef: string, amountUsd?: number) => Promise<void>;
  endorseBol: (shipmentId: string, bolNumber: string, vesselName: string) => Promise<void>;
  assignYardSlot: (shipmentId: string, slotCoord: string) => Promise<void>;
  issueGateOut: (shipmentId: string) => Promise<void>;
  assessCustomsDuty: (shipmentId: string, channel: 'GREEN' | 'YELLOW' | 'RED', assessedCif: number, totalPayable: number) => Promise<void>;
  dispatchConvoy: (shipmentId: string, truckPlate: string, driver: string, sealId: string) => Promise<void>;
  logConvoyArrival: (shipmentId: string) => Promise<void>;
  inspectAndIssueLibre: (shipmentId: string, plateNumber: string) => Promise<void>;

  // Super Admin God Mode Controls
  godModeSetStage: (shipmentId: string, targetStage: ShipmentStage) => Promise<void>;
  godModeFastForward: (shipmentId: string) => Promise<void>;
  godModeOverrideValues: (shipmentId: string, updates: Partial<Shipment>) => Promise<void>;
  godModeInjectChaos: (chaosKey: string, active: boolean, alertMessage?: string) => void;
  godModeBroadcastBulletin: (message: string | null) => void;
  godModeResetDatabase: () => void;
}

const STORAGE_KEY_SHIPMENTS = 'ncis_live_shipments';
const STORAGE_KEY_LOGS = 'ncis_live_audit_logs';
const STORAGE_KEY_NOTIFS = 'ncis_live_notifications';
const STORAGE_KEY_BULLETIN = 'ncis_live_bulletin';

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial State with LocalStorage fallback
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return MOCK_SHIPMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [
      {
        id: 'notif-init-1',
        timestamp: 'Just now',
        title: 'National Single Window Active',
        message: 'All 8 stakeholder agencies connected to live cryptographic audit ledger.',
        type: 'SUCCESS',
        actor: 'NCIS Command',
        role: 'SUPER_ADMIN',
        read: false,
      }
    ];
  });

  const [flashBulletin, setFlashBulletin] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_BULLETIN);
    } catch {
      return null;
    }
  });

  const [activeChaosEvents, setActiveChaosEvents] = useState<Record<string, boolean>>({
    TAMPER_ALARM: false,
    PORT_GRIDLOCK: false,
    UNDER_INVOICING_AUDIT: false,
    ASYCUDA_DEGRADED: false,
  });

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
    } catch {}
  }, [shipments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      if (flashBulletin) {
        localStorage.setItem(STORAGE_KEY_BULLETIN, flashBulletin);
      } else {
        localStorage.removeItem(STORAGE_KEY_BULLETIN);
      }
    } catch {}
  }, [flashBulletin]);

  // Helper to add notification & log
  const notifyAndLog = (
    title: string,
    message: string,
    type: AppNotification['type'],
    actorName: string,
    actorRole: UserRole | string,
    shipmentId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title,
      message,
      type,
      actor: actorName,
      role: actorRole,
      shipmentId,
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      shipmentId,
      actorName,
      actorRole: actorRole as any,
      action: title,
      details: message,
      timestamp: new Date().toISOString(),
      hash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // =========================================================================
  // INTERCONNECTED LIFECYCLE STATE TRANSITIONS
  // =========================================================================

  // 1. Importer creates shipment -> PRE_IMPORT
  const createShipment = async (data: any): Promise<Shipment> => {
    const id = `shp-${Date.now().toString(36)}`;
    const trackingNumber = `ET-SHP-2026-${String(shipments.length + 1).padStart(3, '0')}`;

    const newShipment: Shipment = {
      id,
      trackingNumber,
      originPort: data.originPort || 'Port of Jebel Ali, UAE',
      destinationPort: data.destinationPort || 'Modjo Dry Port',
      currentStage: 'PRE_IMPORT',
      status: 'AWAITING_FX_APPROVAL',
      delayRiskRating: 'LOW',
      importerId: 'usr-imp-01',
      importer: {
        fullName: data.importerName || 'Ethio Auto Imports PLC',
        organization: data.importerOrg || 'Ethio Auto Imports PLC',
        email: 'importer@ethioimport.com',
      },
      vehicles: [
        {
          id: `veh-${Date.now()}`,
          shipmentId: id,
          vin: data.vin || `ETH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          make: data.make || 'Toyota',
          model: data.model || 'Corolla Cross',
          year: data.year || 2024,
          engineCc: data.engineCc || 1800,
          fuelType: data.fuelType || 'HYBRID',
          color: data.color || 'Silver Metallic',
          cifValue: data.cifValue || 2850000,
          titleIssued: false,
          qrCodePayload: `NCIS:VIN:${data.vin || 'PENDING'}`,
        }
      ],
      customsAssessment: {
        assessedCif: data.cifValue || 2850000,
        totalPayable: Math.round((data.cifValue || 2850000) * 0.64),
        paymentStatus: 'UNPAID',
        channel: 'GREEN',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setShipments(prev => [newShipment, ...prev]);
    notifyAndLog(
      'Consignment Lodged',
      `Importer registered ${newShipment.vehicles?.[0]?.make} ${newShipment.vehicles?.[0]?.model} (${trackingNumber}). Queued for CBE FX allocation.`,
      'INFO',
      'Alazar Tadesse',
      'IMPORTER_SUPPLIER',
      id
    );

    try {
      await api.createShipment(data);
    } catch {}

    return newShipment;
  };

  // 2. Bank authorizes FX -> SHIPPING
  const authorizeFx = async (shipmentId: string, bankRef: string, amountUsd: number = 38500): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: 'SHIPPING',
          status: 'FX_ALLOCATED_IN_TRANSIT',
          notes: `CBE Letter of Credit Authorized (${bankRef}). Released $${amountUsd.toLocaleString()} USD.`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'Trade Finance FX Approved',
      `Commercial Bank of Ethiopia released $${amountUsd.toLocaleString()} USD under L/C ${bankRef} for ${target?.trackingNumber || shipmentId}. Consignment advanced to Sea Shipping.`,
      'SUCCESS',
      'Selamawit Desta',
      'FINANCIAL_INSURANCE',
      shipmentId
    );

    try {
      await api.updateStage(shipmentId, 'SHIPPING', `L/C FX Approved: ${bankRef}`);
    } catch {}
  };

  // 3. Shipping endorses B/L -> PORT_OPERATIONS
  const endorseBol = async (shipmentId: string, bolNumber: string, vesselName: string): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: 'PORT_OPERATIONS',
          status: 'DISCHARGED_AT_PORT',
          billOfLadingNumber: bolNumber,
          vesselName: vesselName || 'MV Horn Pioneer',
          voyageNumber: 'HP-2026-09A',
          containerNumber: s.containerNumber || `MSCU${Math.floor(1000000 + Math.random() * 9000000)}`,
          notes: `e-B/L ${bolNumber} digitally endorsed aboard ${vesselName}. Discharged at Doraleh Container Terminal.`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'Ocean B/L Title Endorsed',
      `Horn Maritime Line endorsed e-B/L ${bolNumber} aboard ${vesselName}. Container staged at Port of Djibouti.`,
      'SUCCESS',
      'Capt. Michael Chen',
      'SHIPPING_COMPANY',
      shipmentId
    );

    try {
      await api.updateStage(shipmentId, 'PORT_OPERATIONS', `e-B/L endorsed: ${bolNumber}`);
    } catch {}
  };

  // 4. Port Operator assigns yard slot and clears Gate-Out -> CUSTOMS
  const assignYardSlot = async (shipmentId: string, slotCoord: string): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentLocationName: `Doraleh Yard Slot ${slotCoord}`,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const issueGateOut = async (shipmentId: string): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: 'CUSTOMS',
          status: 'CUSTOMS_CLEARANCE',
          notes: 'Truck Interchange Receipt (TIR) issued at Doraleh Gate 4. Arrived at Modjo Multimodal Dry Port.',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'Port Gate-Out Issued',
      `Doraleh Terminal issued gate-out clearance for ${target?.trackingNumber || shipmentId}. Transferred to Modjo Dry Port Customs Queue.`,
      'INFO',
      'Fatuma Omar',
      'PORT_OPERATOR',
      shipmentId
    );

    try {
      await api.updateStage(shipmentId, 'CUSTOMS', 'Doraleh Gate-out complete. Queued for Customs.');
    } catch {}
  };

  // 5. Customs assesses duty and settles tax escrow -> POST_CUSTOMS
  const assessCustomsDuty = async (
    shipmentId: string,
    channel: 'GREEN' | 'YELLOW' | 'RED',
    assessedCif: number,
    totalPayable: number
  ): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: 'POST_CUSTOMS',
          status: 'DUTY_PAID_IN_TRANSIT',
          customsAssessment: {
            declarationNumber: `ECC-DEC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            assessedCif,
            totalPayable,
            paymentStatus: 'PAID',
            channel,
          },
          notes: `Customs Form C-30 Approved (${channel} Channel). Taxes ${totalPayable.toLocaleString()} ETB settled via RTGS Escrow.`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'Customs Form C-30 Released',
      `Customs Officer Yohannes Wolde cleared ${target?.trackingNumber || shipmentId} under ${channel} Channel. ${totalPayable.toLocaleString()} ETB duty paid in full.`,
      'SUCCESS',
      'Hiwot Girma',
      'CUSTOMS_AUTHORITY',
      shipmentId
    );

    try {
      await api.updateStage(shipmentId, 'POST_CUSTOMS', `Form C-30 Cleared: ${channel} Channel`);
    } catch {}
  };

  // 6. Transport dispatches prime mover with ECTS seal -> DELIVERY
  const dispatchConvoy = async (shipmentId: string, truckPlate: string, driver: string, sealId: string): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          status: 'CORRIDOR_CONVOY_ACTIVE',
          notes: `Prime mover ${truckPlate} (Driver: ${driver}) armed with ECTS Smart Seal ${sealId}. En route via Galafi.`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'ECTS Convoy Dispatched',
      `Trans-Ethiopia convoy ${truckPlate} armed with smart seal ${sealId} carrying ${target?.trackingNumber || shipmentId} departed for Kality.`,
      'INFO',
      'Solomon Getachew',
      'TRANSPORT_FORWARDER',
      shipmentId
    );
  };

  const logConvoyArrival = async (shipmentId: string): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: 'DELIVERY',
          status: 'AT_INSPECTION_STATION',
          notes: 'Arrived at Kality Testing Depot. E-seal disarmed. Queued for MOTL roadworthiness inspection.',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'Convoy Arrived at Kality Depot',
      `${target?.trackingNumber || shipmentId} arrived safely at Kality Testing Station. E-seal integrity verified.`,
      'SUCCESS',
      'Solomon Getachew',
      'TRANSPORT_FORWARDER',
      shipmentId
    );

    try {
      await api.updateStage(shipmentId, 'DELIVERY', 'Arrived at Kality Inspection Station');
    } catch {}
  };

  // 7. Vehicle Registration inspects & issues Libre -> COMPLETED
  const inspectAndIssueLibre = async (shipmentId: string, plateNumber: string): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        const updatedVehicles = (s.vehicles || []).map(v => ({
          ...v,
          registrationPlate: plateNumber,
          titleIssued: true,
        }));
        return {
          ...s,
          status: 'DELIVERED',
          vehicles: updatedVehicles,
          notes: `MOTL Roadworthiness Certified. Regional License Plate ${plateNumber} assigned. Digital Libre issued.`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const target = shipments.find(s => s.id === shipmentId);
    notifyAndLog(
      'Digital Libre & Plate Issued',
      `Federal Transport Authority assigned plate ${plateNumber} to ${target?.vehicles?.[0]?.make} ${target?.vehicles?.[0]?.model} (${target?.trackingNumber}). Import journey complete!`,
      'SUCCESS',
      'Eng. Birhanu Alemu',
      'VEHICLE_REGISTRATION',
      shipmentId
    );

    try {
      await api.updateStage(shipmentId, 'DELIVERY', `Libre Title Issued: Plate ${plateNumber}`);
    } catch {}
  };

  // =========================================================================
  // SUPER ADMIN GOD MODE CONTROLS
  // =========================================================================

  const godModeSetStage = async (shipmentId: string, targetStage: ShipmentStage): Promise<void> => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: targetStage,
          status: `GOD_MODE_${targetStage}`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    notifyAndLog(
      '⚡ God Mode Stage Override',
      `National Command forced consignment ${shipmentId} stage to ${targetStage}.`,
      'WARNING',
      'Abebe Bekele',
      'SUPER_ADMIN',
      shipmentId
    );
  };

  const godModeFastForward = async (shipmentId: string): Promise<void> => {
    const randomPlate = `2-B${Math.floor(10000 + Math.random() * 90000)} AA`;
    setShipments(prev =>
      prev.map(s => {
        if (s.id !== shipmentId) return s;
        return {
          ...s,
          currentStage: 'DELIVERY',
          status: 'DELIVERED',
          billOfLadingNumber: s.billOfLadingNumber || 'HML-BOL-2026-GODMODE',
          containerNumber: s.containerNumber || 'MSCU-GODMODE-01',
          customsAssessment: {
            declarationNumber: 'ECC-DEC-GODMODE',
            assessedCif: s.vehicles?.[0]?.cifValue || 3500000,
            totalPayable: Math.round((s.vehicles?.[0]?.cifValue || 3500000) * 0.64),
            paymentStatus: 'PAID',
            channel: 'GREEN',
          },
          vehicles: (s.vehicles || []).map(v => ({
            ...v,
            registrationPlate: randomPlate,
            titleIssued: true,
          })),
          notes: '⚡ Sovereign God Mode: Fast-forwarded through all 8 regulatory checkpoints directly to title completion.',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    notifyAndLog(
      '⚡ Fast-Forwarded to Completion',
      `Sovereign God Mode instantly certified and licensed ${shipmentId} with plate ${randomPlate}.`,
      'SUCCESS',
      'Abebe Bekele',
      'SUPER_ADMIN',
      shipmentId
    );
  };

  const godModeOverrideValues = async (shipmentId: string, updates: Partial<Shipment>): Promise<void> => {
    setShipments(prev =>
      prev.map(s => (s.id === shipmentId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );

    notifyAndLog(
      '⚡ Record Fields Overridden',
      `Sovereign God Mode updated database attributes on consignment ${shipmentId}.`,
      'WARNING',
      'Abebe Bekele',
      'SUPER_ADMIN',
      shipmentId
    );
  };

  const godModeInjectChaos = (chaosKey: string, active: boolean, alertMessage?: string) => {
    setActiveChaosEvents(prev => ({ ...prev, [chaosKey]: active }));

    if (active) {
      notifyAndLog(
        `🚨 Chaos Injected: ${chaosKey}`,
        alertMessage || `Simulated operational incident triggered across the national supply chain: ${chaosKey}`,
        'DANGER',
        'Command Simulation Matrix',
        'SUPER_ADMIN'
      );
    } else {
      notifyAndLog(
        `Incident Resolved: ${chaosKey}`,
        `Normal operating parameters restored for ${chaosKey}.`,
        'INFO',
        'Command Simulation Matrix',
        'SUPER_ADMIN'
      );
    }
  };

  const godModeBroadcastBulletin = (message: string | null) => {
    setFlashBulletin(message);
    if (message) {
      notifyAndLog(
        '📢 National Flash Directive',
        `National Command broadcast an operational bulletin: "${message}"`,
        'WARNING',
        'Abebe Bekele',
        'SUPER_ADMIN'
      );
    }
  };

  const godModeResetDatabase = () => {
    setShipments(MOCK_SHIPMENTS);
    setNotifications([]);
    setFlashBulletin(null);
    setActiveChaosEvents({
      TAMPER_ALARM: false,
      PORT_GRIDLOCK: false,
      UNDER_INVOICING_AUDIT: false,
      ASYCUDA_DEGRADED: false,
    });
    localStorage.removeItem(STORAGE_KEY_SHIPMENTS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_BULLETIN);

    notifyAndLog(
      'Database Reset to Factory Baseline',
      'All 8 stakeholder databases restored to clean demo state.',
      'INFO',
      'NCIS System Kernel',
      'SUPER_ADMIN'
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ShipmentContext.Provider
      value={{
        shipments,
        auditLogs,
        notifications,
        flashBulletin,
        activeChaosEvents,
        unreadCount,
        markNotificationRead,
        clearAllNotifications,
        createShipment,
        authorizeFx,
        endorseBol,
        assignYardSlot,
        issueGateOut,
        assessCustomsDuty,
        dispatchConvoy,
        logConvoyArrival,
        inspectAndIssueLibre,
        godModeSetStage,
        godModeFastForward,
        godModeOverrideValues,
        godModeInjectChaos,
        godModeBroadcastBulletin,
        godModeResetDatabase,
      }}
    >
      {children}
    </ShipmentContext.Provider>
  );
};

export const useShipments = (): ShipmentContextType => {
  const context = useContext(ShipmentContext);
  if (!context) {
    throw new Error('useShipments must be used within a ShipmentProvider');
  }
  return context;
};
