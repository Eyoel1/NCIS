import React from 'react';
import { Award, Printer, X, ShieldCheck, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface LibreCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    vin: string;
    make: string;
    model: string;
    year: number;
    engineCc: number;
    fuelType: string;
    color: string;
    ownerName: string;
    plateNumber: string;
    registrationDate: string;
    certificateNumber: string;
  };
}

export const LibreCertificateModal: React.FC<LibreCertificateModalProps> = ({
  isOpen,
  onClose,
  vehicle
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Official Digital Vehicle Ownership Certificate (Libre / ሊብሬ)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Libre</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Content - Print View */}
        <div className="p-8 bg-amber-50/40 dark:bg-slate-950 border-4 border-double border-amber-600/40 m-4 rounded-xl space-y-6 relative print:m-0 print:border-2">
          {/* Sovereign Crest */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-serif">
              Federal Democratic Republic of Ethiopia
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
              MINISTRY OF TRANSPORT & LOGISTICS
            </h2>
            <h3 className="text-sm font-serif font-bold text-amber-800 dark:text-amber-400">
              የተሽከርካሪ ባለቤትነት ማረጋገጫ ምስክር ወረቀት (ሊብሬ)
            </h3>
            <span className="inline-block text-[10px] font-mono px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800 mt-1">
              Certificate No: {vehicle.certificateNumber}
            </span>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-b border-amber-300 dark:border-slate-800 py-4">
            <div className="space-y-2">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Owner / Consignee</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{vehicle.ownerName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Make & Model</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{vehicle.make} {vehicle.model} ({vehicle.year})</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Chassis / VIN</span>
                <code className="font-mono font-bold text-slate-900 dark:text-white">{vehicle.vin}</code>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Engine Displacement</span>
                <span className="font-mono">{vehicle.engineCc} cc ({vehicle.fuelType})</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Assigned License Plate</span>
                <span className="inline-block font-mono font-black text-base px-3 py-1 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white rounded-md text-slate-900 dark:text-white shadow-xs">
                  {vehicle.plateNumber}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Vehicle Body Color</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{vehicle.color}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Date of Title Registration</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{vehicle.registrationDate}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Technical Roadworthiness</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Passed (Euro-4 Standard)</span>
              </div>
            </div>
          </div>

          {/* Footer with QR Stamp & Seal */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                <QRCodeSVG
                  value={`NCIS-LIBRE:${vehicle.certificateNumber}:VIN:${vehicle.vin}:PLATE:${vehicle.plateNumber}`}
                  size={64}
                />
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <span className="block font-bold text-slate-700 dark:text-slate-300">National Traffic Police QR</span>
                <span>Scan for roadside authenticity verification</span>
                <span className="block font-mono text-[9px] text-emerald-600">ECDSA-SEALED: 0x9924...10b</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block">Registrar General</span>
              <span className="font-serif font-bold text-slate-900 dark:text-white text-xs block mt-1">
                Biruk Assefa
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Federal Transport Authority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
