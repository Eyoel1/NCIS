export interface MonthlyRevenuePoint {
  month: string;
  duty: number;
  excise: number;
  vat: number;
  surtax: number;
  total: number;
}

export const MONTHLY_REVENUE_DATA: MonthlyRevenuePoint[] = [
  { month: 'Oct 2025', duty: 142, excise: 188, vat: 104, surtax: 58, total: 492 },
  { month: 'Nov 2025', duty: 165, excise: 210, vat: 118, surtax: 66, total: 559 },
  { month: 'Dec 2025', duty: 198, excise: 254, vat: 142, surtax: 79, total: 673 },
  { month: 'Jan 2026', duty: 180, excise: 232, vat: 130, surtax: 72, total: 614 },
  { month: 'Feb 2026', duty: 215, excise: 278, vat: 156, surtax: 86, total: 735 },
  { month: 'Mar 2026', duty: 242, excise: 310, vat: 174, surtax: 97, total: 823 },
];

export const CORRIDOR_TRANSIT_TIME_DATA = [
  { segment: 'Djibouti -> Galafi', hours: 6.2, target: 5.0 },
  { segment: 'Galafi (Customs)', hours: 4.8, target: 2.0 },
  { segment: 'Galafi -> Awash', hours: 9.5, target: 8.0 },
  { segment: 'Awash -> Modjo', hours: 7.4, target: 6.5 },
  { segment: 'Modjo -> Kality', hours: 4.5, target: 3.5 },
];

export const PORT_CONGESTION_DATA = [
  { port: 'Doraleh (DCT)', occupancy: 91, dwellDays: 4.2, status: 'HIGH' },
  { port: 'Berbera Port', occupancy: 58, dwellDays: 2.1, status: 'NORMAL' },
  { port: 'Modjo Dry Port', occupancy: 84, dwellDays: 3.5, status: 'ELEVATED' },
  { port: 'Kality Depot', occupancy: 48, dwellDays: 1.4, status: 'NORMAL' },
];

export const CUSTOMS_CHANNEL_DATA = [
  { name: 'Green (Immediate)', value: 68, color: '#10b981' },
  { name: 'Yellow (Doc Audit)', value: 24, color: '#f59e0b' },
  { name: 'Red (Physical Scan)', value: 8, color: '#f43f5e' },
];

export const STAKEHOLDER_ACTIVITY_DATA = [
  { role: 'Customs (ECC)', actions: 1420 },
  { role: 'Importers', actions: 980 },
  { role: 'Port Terminals', actions: 840 },
  { role: 'Transport Convoys', actions: 760 },
  { role: 'Commercial Banks', actions: 620 },
  { role: 'MOTL Registration', actions: 510 },
  { role: 'Shipping Lines', actions: 430 },
];
