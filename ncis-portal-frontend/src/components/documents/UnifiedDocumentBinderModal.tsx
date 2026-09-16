import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Building2,
  Ship,
  Layers,
  Scale,
  Truck,
  Award,
  CheckCircle2,
  Clock,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Shipment } from '../../types';

interface UnifiedDocumentBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

type TabType = 'INVOICE' | 'FX_LC' | 'BOL' | 'EIR' | 'C30' | 'CMR' | 'LIBRE';

export const UnifiedDocumentBinderModal: React.FC<UnifiedDocumentBinderModalProps> = ({
  isOpen,
  onClose,
  shipment
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('INVOICE');

  if (!isOpen || !shipment) return null;

  const vehicle = shipment.vehicles?.[0] || {
    make: 'Toyota',
    model: 'Land Cruiser Prado TX',
    year: 2024,
    vin: 'AHT02981048201',
    engineCc: 2755,
    fuelType: 'DIESEL',
    cifValue: 3850000,
    registrationPlate: '2-B84920 AA',
    color: 'Pearl White'
  };

  const cifEtb = shipment.customsAssessment?.assessedCif || vehicle.cifValue || 3850000;
  const dutyPayable = shipment.customsAssessment?.totalPayable || Math.round(cifEtb * 0.64);
  const bolNo = shipment.billOfLadingNumber || 'HML-BOL-2026-84920';
  const containerNo = shipment.containerNumber || 'MSCU7849201';
  const plateNo = vehicle.registrationPlate || '2-B84920 AA';

  const tabs: { id: TabType; label: string; icon: any; stageReq: string }[] = [
    { id: 'INVOICE', label: '1. Commercial Invoice', icon: FileText, stageReq: 'PRE_IMPORT' },
    { id: 'FX_LC', label: '2. NBE FX & L/C', icon: Building2, stageReq: 'SHIPPING' },
    { id: 'BOL', label: '3. Ocean Bill of Lading', icon: Ship, stageReq: 'PORT_OPERATIONS' },
    { id: 'EIR', label: '4. Port Yard EIR', icon: Layers, stageReq: 'CUSTOMS' },
    { id: 'C30', label: '5. Customs Form C-30', icon: Scale, stageReq: 'POST_CUSTOMS' },
    { id: 'CMR', label: '6. ECTS Waybill', icon: Truck, stageReq: 'DELIVERY' },
    { id: 'LIBRE', label: '7. Digital Libre Title', icon: Award, stageReq: 'DELIVERY' },
  ];

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Binder Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                National Sovereign Cargo Dossier Binder
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Consignment: <strong className="text-slate-900 dark:text-white">{shipment.trackingNumber}</strong> • VIN: <code className="text-brand-600 dark:text-brand-400">{vehicle.vin}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:opacity-90 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 overflow-x-auto no-print">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Document Contents */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">

          {/* 1. Commercial Invoice */}
          {activeTab === 'INVOICE' && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">TOYOTA TSUSHO CORPORATION</h3>
                  <span className="text-slate-500 block">JAFZA Logistics Park, Bay 4, Dubai, UAE</span>
                  <span className="text-[10px] text-slate-400 font-mono">Tax ID: AE-998240-TRN</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono">Invoice Reference</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">INV-2026-TTC-8492</span>
                  <span className="text-[10px] text-slate-500 block">Date: 2026-02-18</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Consignee (Importer)</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{shipment.importer?.fullName || 'Ethio Auto Imports PLC'}</p>
                  <p className="text-slate-500 text-[11px]">Bole Sub-City, Addis Ababa, Ethiopia • TIN: 0048291048</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Payment & Port Terms</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">CIF Port of Djibouti (Doraleh DCT)</p>
                  <p className="text-slate-500 text-[11px]">Commercial L/C at Sight via Commercial Bank of Ethiopia</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-400">
                    <th className="py-2">Item Description</th>
                    <th className="py-2">Chassis / VIN</th>
                    <th className="py-2">Engine</th>
                    <th className="py-2 text-right">FOB (USD)</th>
                    <th className="py-2 text-right">CIF (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="py-2.5 font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                    <td className="py-2.5 font-mono">{vehicle.vin}</td>
                    <td className="py-2.5 font-mono">{vehicle.engineCc} cc ({vehicle.fuelType})</td>
                    <td className="py-2.5 font-mono text-right">${Math.round(cifEtb / 125).toLocaleString()}</td>
                    <td className="py-2.5 font-mono font-bold text-right">{cifEtb.toLocaleString()} ETB</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-emerald-600 font-mono font-bold">✓ OCR VERIFIED & DIGITAL STAMPED</span>
                <span className="font-mono text-slate-500">Dubai Chamber of Commerce Export Seal #84920</span>
              </div>
            </div>
          )}

          {/* 2. NBE FX & L/C */}
          {activeTab === 'FX_LC' && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">COMMERCIAL BANK OF ETHIOPIA</h3>
                  <span className="text-slate-500 block">Trade Finance & Foreign Exchange Operations Directorate</span>
                  <span className="text-[10px] text-slate-400 font-mono">SWIFT BIC: CBETETAA</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono">Irrevocable Documentary Credit</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">SWIFT MT-700 / CBE-LC-2026-991</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">NBE FX Allocation Permit</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">NBE-FX-2026-081 (Priority Tier 1)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Released FX Amount</span>
                  <p className="font-mono font-bold text-emerald-600 mt-0.5">${Math.round(cifEtb / 125).toLocaleString()} USD (125.00 ETB/USD)</p>
                </div>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Beneficiary</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">Toyota Tsusho Corporation Dubai (via Standard Chartered Dubai)</p>
                <p className="text-[11px] text-slate-500 pt-1">Condition: Full set of clean on-board marine ocean Bills of Lading endorsed to Commercial Bank of Ethiopia.</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-emerald-600 font-mono font-bold">✓ RTGS ESCROW COLLATERAL LOCKED</span>
                <span className="font-mono text-slate-500">Authorized: Selamawit Desta (CBE Trade Finance)</span>
              </div>
            </div>
          )}

          {/* 3. Ocean B/L */}
          {activeTab === 'BOL' && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">HORN MARITIME LINE S.A.</h3>
                  <span className="text-slate-500 block">Multimodal Transport Bill of Lading</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono">B/L Number</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{bolNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Ocean Vessel</span>
                  <p className="font-bold text-slate-900 dark:text-white">{shipment.vesselName || 'MV Horn Pioneer'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Port of Loading</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">Jebel Ali (AEJEA)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Port of Discharge</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">Djibouti Doraleh (DJJIB)</p>
                </div>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span>Container: <strong>{containerNo}</strong></span>
                  <span>Seal: <strong>ET-SEAL-99824</strong></span>
                  <span>Weight: <strong>2,850 KG</strong></span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                  1 Unit {vehicle.year} {vehicle.make} {vehicle.model} (VIN: {vehicle.vin}). Shipped in apparent good order and condition.
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-emerald-600 font-mono font-bold">✓ TITLE ENDORSED TO BANK ORDER</span>
                <span className="font-mono text-slate-500">Master: Capt. Michael Chen</span>
              </div>
            </div>
          )}

          {/* 4. Port Yard EIR */}
          {activeTab === 'EIR' && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">DORALEH CONTAINER TERMINAL (DCT)</h3>
                  <span className="text-slate-500 block">Equipment Interchange Receipt (EIR) & Yard Discharge Slip</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono">EIR Record</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">EIR-DCT-2026-44102</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Terminal Staging Location</span>
                  <p className="font-mono font-bold text-brand-600 dark:text-brand-400 mt-0.5">BAY-04 / ROW-02 / TIER-1</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Stevedoring Status</span>
                  <p className="font-bold text-emerald-600 mt-0.5">Discharged & Gate-Out Cleared</p>
                </div>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Weighbridge Certificate</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">Gross Weight: 4,120 KG • Tare: 1,270 KG • Net Cargo: 2,850 KG</p>
                <p className="text-[11px] text-slate-500">Container condition: Sound, no dents, customs seal intact.</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-emerald-600 font-mono font-bold">✓ DISPATCHED TO TRANS-ETHIOPIA CONVOY</span>
                <span className="font-mono text-slate-500">Gate Officer: Fatuma Omar</span>
              </div>
            </div>
          )}

          {/* 5. Customs Form C-30 */}
          {activeTab === 'C30' && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">ETHIOPIAN CUSTOMS COMMISSION (ECC)</h3>
                  <span className="text-slate-500 block">Modjo Branch • Form C-30 Customs Clearance & Release Warrant</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono">Declaration Reference</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">ECC-DEC-2026-78491</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Assessed CIF</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{cifEtb.toLocaleString()} ETB</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Risk Channel</span>
                  <p className="font-bold text-emerald-600">🟢 GREEN (Automated)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Total Taxes Paid</span>
                  <p className="font-mono font-bold text-emerald-600">{dutyPayable.toLocaleString()} ETB</p>
                </div>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 text-[11px]">
                <div className="grid grid-cols-5 gap-1 text-center font-mono">
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">Duty: 35%</div>
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">Excise: 30%</div>
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">VAT: 15%</div>
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">Surtax: 10%</div>
                  <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">WHT: 3%</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-emerald-600 font-mono font-bold">✓ OFFICIAL RELEASE WARRANT ISSUED</span>
                <span className="font-mono text-slate-500">Customs Officer: Hiwot Girma</span>
              </div>
            </div>
          )}

          {/* 6. ECTS Waybill */}
          {activeTab === 'CMR' && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">TRANS-ETHIOPIA FREIGHT FORWARDING</h3>
                  <span className="text-slate-500 block">Corridor Transit Consignment Note & ECTS Waybill</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-mono">Waybill Reference</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">CMR-ET-2026-9924</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Prime Mover & Driver</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">Plate: 3-B92014 ET (Driver: Kassahun Bekele)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">ECTS Smart E-Seal</span>
                  <p className="font-mono font-bold text-emerald-600 mt-0.5">ECTS-ET-88924 (Armed & Locked)</p>
                </div>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Route Waypoint Checkpoints</span>
                <p className="text-slate-700 dark:text-slate-300">Doraleh Port Gate ──▶ Galafi Border ──▶ Awash Arba ──▶ Modjo Dry Port ──▶ Kality Depot</p>
                <p className="text-emerald-600 font-mono text-[10px]">Zero geofence deviations • Tamper integrity verified at all gates</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-emerald-600 font-mono font-bold">✓ DELIVERED TO KALITY INSPECTION RAMP</span>
                <span className="font-mono text-slate-500">Dispatcher: Solomon Getachew</span>
              </div>
            </div>
          )}

          {/* 7. Digital Libre */}
          {activeTab === 'LIBRE' && (
            <div className="bg-amber-50/40 dark:bg-slate-950 border-4 border-double border-amber-600/40 p-6 rounded-2xl shadow-xs space-y-4 text-xs relative">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-serif block">
                  Federal Democratic Republic of Ethiopia
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  MINISTRY OF TRANSPORT & LOGISTICS
                </h3>
                <h4 className="text-xs font-serif font-bold text-amber-800 dark:text-amber-400">
                  የተሽከርካሪ ባለቤትነት ማረጋገጫ ምስክር ወረቀት (ሊብሬ)
                </h4>
                <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                  Title Cert # MOTL-ET-2026-89410
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-b border-amber-300 dark:border-slate-800 py-3 text-[11px]">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Registered Owner</span>
                    <strong className="text-slate-900 dark:text-white">{shipment.importer?.fullName || 'Ethio Auto Imports PLC'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Make & Model</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Chassis / VIN</span>
                    <code className="font-mono font-bold text-slate-900 dark:text-white">{vehicle.vin}</code>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Assigned Regional Plate</span>
                    <span className="inline-block font-mono font-black text-sm px-2.5 py-0.5 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white rounded text-slate-900 dark:text-white">
                      {plateNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Technical Roadworthiness</span>
                    <strong className="text-emerald-600">Passed (Euro-4 Certified)</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block">Registration Date</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">2026-03-08 (Yekatit 29, 2018)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <QRCodeSVG value={`NCIS-LIBRE:MOTL-89410:VIN:${vehicle.vin}:PLATE:${plateNo}`} size={50} />
                  </div>
                  <div className="text-[9px] text-slate-500">
                    <span className="block font-bold text-slate-700 dark:text-slate-300">National Traffic Police QR</span>
                    <span>Roadside authenticity scan</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase text-slate-400 block">Registrar General</span>
                  <span className="font-serif font-bold text-slate-900 dark:text-white text-xs block">Eng. Birhanu Alemu</span>
                  <span className="text-[9px] text-slate-500">Federal Transport Authority</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
