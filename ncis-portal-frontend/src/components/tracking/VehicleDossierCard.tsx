import React, { useState } from 'react';
import { Shipment, Vehicle } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { Car, Fuel, Calendar, Gauge, Shield, QrCode, Share2, CheckCircle2, Copy } from 'lucide-react';
import { VehicleQrModal } from '../qr/VehicleQrModal';

interface VehicleDossierCardProps {
  shipment: Shipment;
}

export const VehicleDossierCard: React.FC<VehicleDossierCardProps> = ({ shipment }) => {
  const { t } = useTranslation();
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const vehicle: Vehicle = shipment.vehicles?.[0] || {
    id: 'unknown',
    shipmentId: shipment.id,
    vin: 'ETH-VIN-PENDING',
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    engineCc: 1800,
    fuelType: 'HYBRID',
    cifValue: 2500000,
    color: 'White',
    titleIssued: false,
    qrCodePayload: `https://ncis.gov.et/track/${shipment.trackingNumber}`,
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background watermark */}
      <Car className="absolute -right-6 -bottom-6 w-44 h-44 text-slate-800/20 pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            {t('nav.tracker', 'Vehicle Dossier')}
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">
            {vehicle?.make || 'Unknown'} {vehicle?.model || ''} ({vehicle?.year || 'N/A'})
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-slate-400">
              VIN: <span className="text-slate-200 font-semibold">{vehicle?.vin || 'N/A'}</span>
            </span>
            {vehicle?.registrationPlate && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Plate: {vehicle.registrationPlate}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? t('common.copied', 'Copied!') : t('common.copyLink', 'Share Link')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>{t('actions.viewQr', 'QR Pass')}</span>
          </button>
        </div>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 text-xs">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Gauge className="h-3.5 w-3.5 text-sky-400" />
            <span>{t('vehicle.engineCc', 'Engine (cc)')}</span>
          </div>
          <span className="font-bold text-white text-sm font-mono">{vehicle.engineCc ?? 0} cc</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Fuel className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('vehicle.fuelType', 'Fuel Type')}</span>
          </div>
          <span className="font-bold text-white text-sm">{vehicle?.fuelType || 'N/A'}</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('vehicle.color', 'Color')}</span>
          </div>
          <span className="font-bold text-white text-sm">{vehicle?.color || 'N/A'}</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>{t('customs.cif', 'Assessed CIF')}</span>
          </div>
          <span className="font-bold text-white text-sm font-mono">
            {(vehicle.cifValue ?? 0).toLocaleString()} ETB
          </span>
        </div>
      </div>

      {/* Logistics & Transit Details Bar */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <span className="text-slate-400 block text-[11px]">Origin → Destination</span>
          <span className="font-medium text-slate-200">
            {shipment.originPort} → {shipment.destinationPort}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Carrier / Vessel</span>
          <span className="font-medium text-slate-200">
            {shipment.shippingLine || 'Horn Maritime'} ({shipment.vesselName || 'MV Horn Pioneer'})
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Container / Seal</span>
          <span className="font-mono text-slate-200">
            {shipment.containerNumber || 'MSKU-948201-4'}
          </span>
        </div>
      </div>

      {/* QR Modal */}
      <VehicleQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        shipment={shipment}
        vehicle={vehicle}
      />
    </div>
  );
};
