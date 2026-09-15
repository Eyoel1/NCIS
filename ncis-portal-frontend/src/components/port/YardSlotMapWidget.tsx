import React, { useState } from 'react';
import { Layers, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface YardSlot {
  coord: string; // e.g. BAY-04-R2-T1
  container: string;
  vehicle: string;
  dwellDays: number;
  freeTimeLimit: number; // 5 days standard
  status: 'SAFE' | 'WARNING' | 'DEMURRAGE';
}

const INITIAL_SLOTS: YardSlot[] = [
  { coord: 'BAY-01-R1-T1', container: 'MSCU7849201', vehicle: 'Toyota Prado TX', dwellDays: 2.1, freeTimeLimit: 5, status: 'SAFE' },
  { coord: 'BAY-01-R1-T2', container: 'CMAU9821440', vehicle: 'BYD Atto 3 EV', dwellDays: 4.8, freeTimeLimit: 5, status: 'WARNING' },
  { coord: 'BAY-01-R2-T1', container: 'EACU5510293', vehicle: 'Isuzu FTR Truck', dwellDays: 7.2, freeTimeLimit: 5, status: 'DEMURRAGE' },
  { coord: 'BAY-02-R1-T1', container: 'HLCU1194820', vehicle: 'Suzuki Dzire GL', dwellDays: 1.2, freeTimeLimit: 5, status: 'SAFE' },
  { coord: 'BAY-02-R1-T2', container: 'MSCU3301948', vehicle: 'Hyundai Tucson', dwellDays: 3.9, freeTimeLimit: 5, status: 'SAFE' },
  { coord: 'BAY-02-R2-T1', container: 'TEMU9948201', vehicle: 'Toyota Hilux 4x4', dwellDays: 6.4, freeTimeLimit: 5, status: 'DEMURRAGE' },
];

export const YardSlotMapWidget: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<YardSlot>(INITIAL_SLOTS[0]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Doraleh Terminal Operating System (TOS) — Yard Slot Locator & Demurrage Timer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time Bay/Row/Tier slot allocation and port storage penalty countdown (5-day free time)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;3 Days (Free)
          </span>
          <span className="flex items-center gap-1.5 text-amber-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 4-5 Days (Expiring)
          </span>
          <span className="flex items-center gap-1.5 text-rose-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;5 Days (Demurrage)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yard 2D Grid */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Sector C Container Staging Grid (Click to Inspect)
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {INITIAL_SLOTS.map(slot => {
              const isSelected = selectedSlot.coord === slot.coord;
              const bgClass =
                slot.status === 'DEMURRAGE'
                  ? 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  : slot.status === 'WARNING'
                  ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';

              return (
                <button
                  key={slot.coord}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative card-hover-lift ${bgClass} ${
                    isSelected ? 'ring-2 ring-brand-500 shadow-md' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <span className="text-[10px] font-mono block font-bold">
                    {slot.coord}
                  </span>
                  <span className="text-[11px] font-mono font-extrabold truncate block mt-1 text-slate-900 dark:text-white">
                    {slot.container.substring(0, 8)}...
                  </span>
                  <span className="text-[10px] font-mono block mt-1">
                    {slot.dwellDays}d dwell
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Slot Dossier */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Slot Coordinates
            </span>
            <code className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
              {selectedSlot.coord}
            </code>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Container:</span>
              <span className="font-mono font-bold">{selectedSlot.container}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Consigned Vehicle:</span>
              <span className="font-medium">{selectedSlot.vehicle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dwell at Terminal:</span>
              <span className="font-mono font-bold">{selectedSlot.dwellDays} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Free Time Limit:</span>
              <span className="font-mono">{selectedSlot.freeTimeLimit} Days</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {selectedSlot.status === 'DEMURRAGE' ? (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Demurrage Accruing</span>
                </div>
                Daily penalty: <strong className="font-mono">$75.00 USD/day</strong> ({(selectedSlot.dwellDays - selectedSlot.freeTimeLimit).toFixed(1)} days overdue)
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Free-Time Window Active</span>
                </div>
                Remaining: <strong className="font-mono">{(selectedSlot.freeTimeLimit - selectedSlot.dwellDays).toFixed(1)} days</strong> before storage penalty
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
