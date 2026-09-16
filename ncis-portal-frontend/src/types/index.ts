export type UserRole =
  | 'SUPER_ADMIN'
  | 'IMPORTER_SUPPLIER'
  | 'SHIPPING_COMPANY'
  | 'PORT_OPERATOR'
  | 'CUSTOMS_AUTHORITY'
  | 'TRANSPORT_FORWARDER'
  | 'FINANCIAL_INSURANCE'
  | 'VEHICLE_REGISTRATION';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  demoTwoFactorBypass?: boolean;
}

export type ShipmentStage =
  | 'PRE_IMPORT'
  | 'SHIPPING'
  | 'PORT_OPERATIONS'
  | 'CUSTOMS'
  | 'POST_CUSTOMS'
  | 'DELIVERY'
  | 'COMPLETED';

export type DelayRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FuelType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';

export interface Vehicle {
  id: string;
  shipmentId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  engineCc: number;
  fuelType: FuelType;
  cifValue: number;
  color: string;
  registrationPlate?: string;
  titleIssued: boolean;
  qrCodePayload: string;
  fobPriceUsd?: number;
  freightUsd?: number;
  insuranceUsd?: number;
  exchangeRate?: number;
  chassisNumber?: string;
  registrationStatus?: string;
}

export interface Document {
  id: string;
  shipmentId: string;
  type: string;
  fileName: string;
  filePath: string;
  version: number;
  ocrDataJson?: string;
  signedBy?: string;
  signedAt?: string;
  status: string;
  ocrConfidenceScore?: number;
  createdAt: string;
}

export interface CustomsDeclaration {
  id: string;
  shipmentId: string;
  declarationNumber: string;
  assessedCif: number;
  dutyAmount: number;
  exciseAmount: number;
  vatAmount: number;
  surtaxAmount: number;
  withholdingAmount: number;
  totalPayable: number;
  paymentStatus: 'UNPAID' | 'PENDING_BANK_CLEARANCE' | 'PAID' | 'EXEMPTED';
  formalPdfPath?: string;
  declarantName?: string;
  declarantTin?: string;
  customsOffice?: string;
  channel?: 'GREEN' | 'YELLOW' | 'RED';
  paymentReference?: string;
  paymentDate?: string;
  clearedAt?: string;
}

export interface InspectionRecord {
  id: string;
  shipmentId: string;
  vehicleId?: string;
  certificateNumber: string;
  inspectionType: string;
  passed: boolean;
  findings?: string;
  inspectorName?: string;
  inspectionDate: string;
  chassisVerified: boolean;
  engineVerified: boolean;
  emissionsStandard?: string;
  roadworthyStatus?: string;
  assignedPlate?: string;
}

export interface AuditLog {
  id: string;
  shipmentId?: string;
  actorId?: string;
  actorRole?: string;
  actorName?: string;
  action: string;
  stage?: string;
  details?: string;
  previousStateJson?: string;
  newStateJson?: string;
  timestamp: string;
  hash: string;
  previousHash?: string;
  ipAddress?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: {
    fullName: string;
    role: string;
  };
}

export interface Ticket {
  id: string;
  ticketNumber?: string;
  shipmentId: string;
  creatorId: string;
  assignedRole: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  title?: string;
  billOfLadingNumber?: string;
  originPort: string;
  transitPort?: string;
  destinationPort: string;
  currentStage: ShipmentStage;
  status: string;
  importerId: string;
  delayRiskRating: DelayRisk;
  estimatedArrival?: string;
  actualArrival?: string;
  containerNumber?: string;
  vesselName?: string;
  shippingLine?: string;
  voyageNumber?: string;
  currentLocationName?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  importer?: {
    fullName: string;
    organization?: string;
    email: string;
  };
  vehicles?: Vehicle[];
  documents?: Document[];
  customsDeclaration?: CustomsDeclaration;
  inspectionRecords?: InspectionRecord[];
  auditLogs?: AuditLog[];
  tickets?: Ticket[];
  currentLocation?: {
    name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  lifecycleMilestones?: Array<{
    stage: string;
    completed: boolean;
    inProgress: boolean;
    timestamp?: string | null;
  }>;
  customsAssessment?: {
    declarationNumber?: string;
    assessedCif?: number;
    totalPayable?: number;
    paymentStatus?: string;
    channel?: string;
  } | null;
}

export interface DutyCalculationInput {
  cifValue: number;
  engineCapacityCc: number;
  fuelType: FuelType;
  vehicleCategory?: 'PASSENGER' | 'COMMERCIAL' | 'MOTORCYCLE';
  productionYear?: number;
  depreciationYears?: number;
}

export interface DutyCalculationResult {
  cifValue: number;
  dutyRate: number;
  dutyAmount: number;
  exciseRate: number;
  exciseAmount: number;
  vatRate: number;
  vatAmount: number;
  surtaxRate: number;
  surtaxAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  totalPayable: number;
  currency: string;
}

export interface PortCongestionInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  congestionIndex: number;
  dwellTimeDays: number;
  berthOccupancy?: number;
  yardUtilization?: number;
  waitingVessels?: number;
  customsQueue?: number;
  status: 'NORMAL' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  color: string;
  radius: number;
}
