import React from 'react';
import { useShipments } from '../../context/ShipmentContext';
import { Landmark, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export const NbeFxQueueWidget: React.FC = () => {
  const { shipments, authorizeFx } = useShipments();

  // Combine real shipments with initial reference rows
  const realFxRows = shipments.map((s) => {
    const veh = s.vehicles?.[0];
    const cifEtb = s.customsAssessment?.assessedCif || veh?.cifValue || 2850000;
    const usd = Math.round(cifEtb / 125);
    const isApproved = s.currentStage !== 'PRE_IMPORT';
    return {
      id: s.trackingNumber,
      shipmentId: s.id,
      importer: s.importer?.organization || s.importer?.fullName || 'Ethio Auto Imports PLC',
      amountUsd: usd,
      amountEtb: cifEtb,
      category: `${veh?.year || 2024} ${veh?.make || 'Vehicle'} ${veh?.model || ''} (${veh?.fuelType || 'HYBRID'})`,
      status: isApproved ? 'APPROVED' : 'PENDING_NBE',
      bankRef: isApproved ? (s.notes?.match(/CBE-LC-[^\s)]+/)?.[0] || 'CBE-LC-2026-994') : 'Pending L/C Application',
      isReal: true,
    };
  });

  const handleApproveShipment = async (shipmentId: string, amountUsd: number) => {
    const bankRef = `CBE-LC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    await authorizeFx(shipmentId, bankRef, amountUsd);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              National Bank of Ethiopia (NBE) Foreign Exchange & L/C Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Commercial Bank trade finance foreign currency allocation priority roster
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
          NBE FX Weighted Rate: 125.00 ETB / USD
        </span>
      </div>

      <div className="space-y-3">
        {realFxRows.map((alloc) => (
          <div
            key={alloc.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 card-hover-lift"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {alloc.importer}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium">
                  {alloc.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Category: <strong className="text-slate-700 dark:text-slate-300">{alloc.category}</strong> • Bank Ref: <code className="font-mono">{alloc.bankRef}</code>
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                  ${alloc.amountUsd.toLocaleString()} USD
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {alloc.amountEtb.toLocaleString()} ETB
                </span>
              </div>

              <div>
                {alloc.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-200 dark:border-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    FX Released
                  </span>
                ) : (
                  <button
                    onClick={() => handleApproveShipment(alloc.shipmentId, alloc.amountUsd)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Authorize L/C FX</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
