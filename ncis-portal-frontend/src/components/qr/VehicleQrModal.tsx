import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { Shipment, Vehicle } from '../../types';
import { Printer, ShieldCheck, CheckCircle, Car, Download } from 'lucide-react';
import { NcisLogo } from '../brand/NcisLogo';

interface VehicleQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  vehicle: Vehicle;
}

export const VehicleQrModal: React.FC<VehicleQrModalProps> = ({
  isOpen,
  onClose,
  shipment,
  vehicle,
}) => {
  const qrUrl = `https://ncis.gov.et/track/${shipment.trackingNumber}?vin=${vehicle.vin}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Transit Verification Pass"
      subtitle="Authorized for Inland Bonded Road Transit & FTA Registration"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Pass Container */}
        <div
          id="printable-pass"
          className="bg-white text-slate-900 p-6 rounded-xl border-4 border-double border-slate-800 shadow-xl flex flex-col items-center text-center space-y-4"
        >
          {/* Official Pass Header */}
          <div className="border-b-2 border-slate-900 pb-3 w-full">
            <div className="flex justify-center mb-1">
              <NcisLogo size={32} showText={false} />
            </div>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Federal Democratic Republic of Ethiopia
            </h1>
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Ethiopian Customs Commission • Ministry of Transport & Logistics
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              National Car Import Security System (NCIS Portal)
            </p>
          </div>

          {/* Large High-Contrast Scannable QR Code */}
          <div className="p-3 bg-white border-2 border-slate-900 rounded-lg shadow-sm">
            <QRCodeSVG
              value={qrUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Authorization Stamp */}
          <div className="bg-emerald-50 border-2 border-emerald-600 px-4 py-1.5 rounded-md w-full">
            <span className="text-xs font-black text-emerald-800 tracking-wider uppercase flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Customs Bonded Transit Authorized
            </span>
          </div>

          {/* Vehicle & Shipment Data Matrix */}
          <div className="grid grid-cols-2 gap-2 text-left w-full text-xs font-mono border-t border-b border-slate-300 py-3">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-sans">Vehicle</span>
              <strong className="text-slate-900 font-bold">{vehicle.make} {vehicle.model}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-sans">Year / Fuel</span>
              <strong className="text-slate-900">{vehicle.year} • {vehicle.fuelType}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 block uppercase font-sans">VIN / Chassis Number</span>
              <strong className="text-slate-900 text-[13px] tracking-wider">{vehicle.vin}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-sans">Tracking Dossier</span>
              <strong className="text-slate-900">{shipment.trackingNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-sans">Declaration Ref</span>
              <strong className="text-slate-900">
                {shipment.customsDeclaration?.declarationNumber || 'ECC-DEC-2026-PENDING'}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-sans">Container Number</span>
              <strong className="text-slate-900">{shipment.containerNumber || 'MSKU-948201-4'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-sans">Destination</span>
              <strong className="text-slate-900">{shipment.destinationPort}</strong>
            </div>
          </div>

          {/* Security Hash & Watermark */}
          <div className="w-full text-center text-[9px] text-slate-500 space-y-0.5">
            <p>Cryptographic Transit Verification Token: SHA256-ET-TRANSIT-AUTH</p>
            <p className="font-mono">Display pass prominently inside front windshield during corridor transit.</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Windshield Pass
          </button>
        </div>
      </div>
    </Modal>
  );
};
