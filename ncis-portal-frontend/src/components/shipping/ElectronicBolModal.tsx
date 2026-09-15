import React, { useState } from 'react';
import { Ship, Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ElectronicBolModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    bolNumber: string;
    vesselName: string;
    voyageNumber: string;
    originPort: string;
    destinationPort: string;
    shipper: string;
    consignee: string;
    containerNumber: string;
    sealNumber: string;
    cargoDescription: string;
    weightKg: number;
    issueDate: string;
  };
}

export const ElectronicBolModal: React.FC<ElectronicBolModalProps> = ({
  isOpen,
  onClose,
  shipment
}) => {
  const [endorsed, setEndorsed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Official Electronic Ocean Bill of Lading (e-B/L)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print e-B/L</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* B/L Document Layout */}
        <div className="p-6 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 m-4 rounded-xl space-y-4 text-xs">
          {/* Header row */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-white pb-3">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                HORN MARITIME LINE S.A.
              </h2>
              <span className="text-[10px] text-slate-500 block">Red Sea & Gulf of Aden Liner Services</span>
              <span className="text-[10px] font-mono text-slate-400">MULTIMODAL TRANSPORT BILL OF LADING</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">B/L Reference Number</span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {shipment.bolNumber}
              </span>
            </div>
          </div>

          {/* Grid of boxes */}
          <div className="grid grid-cols-2 gap-3 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Shipper / Exporter</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">{shipment.shipper}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Consignee (To Order Of)</span>
              <p className="font-bold text-slate-900 dark:text-white">{shipment.consignee}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-[11px]">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Vessel Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{shipment.vesselName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Voyage #</span>
              <span className="font-mono font-medium">{shipment.voyageNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Port of Loading</span>
              <span className="font-medium">{shipment.originPort}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Port of Discharge</span>
              <span className="font-medium">{shipment.destinationPort}</span>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
            <div className="grid grid-cols-3 gap-2 text-[11px] pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Container No.</span>
                <code className="font-mono font-bold">{shipment.containerNumber}</code>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Seal No.</span>
                <code className="font-mono font-bold">{shipment.sealNumber}</code>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Gross Weight</span>
                <span className="font-mono">{shipment.weightKg.toLocaleString()} KG</span>
              </div>
            </div>
            <div className="pt-2 text-xs">
              <span className="text-[10px] uppercase text-slate-400 block">Description of Goods</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">{shipment.cargoDescription}</p>
            </div>
          </div>

          {/* Endorsement Section */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Issued at: Djibouti Port, Date: {shipment.issueDate}</span>
              <span className="text-[10px] font-mono text-emerald-600">ECDSA: SHA-256 Title Cryptoseal</span>
            </div>

            {endorsed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
                Title Digitally Endorsed
              </span>
            ) : (
              <button
                onClick={() => setEndorsed(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Endorse Maritime Title to Bank</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
