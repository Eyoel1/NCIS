import React, { useState } from 'react';
import { Landmark, CheckCircle2, Clock, AlertCircle, ArrowUpRight, DollarSign } from 'lucide-react';

export const NbeFxQueueWidget: React.FC = () => {
  const [fxAllocations, setFxAllocations] = useState([
    {
      id: 'NBE-FX-2026-081',
      importer: 'Ethio Auto Imports PLC',
      amountUsd: 38500,
      amountEtb: 4812500,
      queueNumber: 14,
      category: 'Commercial Cargo (Priority Tier 2)',
      status: 'APPROVED',
      bankRef: 'CBE-LC-99412',
      approvalDate: '2026-02-14'
    },
    {
      id: 'NBE-FX-2026-094',
      importer: 'Addis Motors Trading',
      amountUsd: 22000,
      amountEtb: 2750000,
      queueNumber: 32,
      category: 'Passenger EV (Incentive Tier 1)',
      status: 'PENDING_NBE',
      bankRef: 'AWASH-LC-8411',
      approvalDate: 'In Review'
    },
    {
      id: 'NBE-FX-2026-102',
      importer: 'Red Sea Transit Agency',
      amountUsd: 46000,
      amountEtb: 5750000,
      queueNumber: 48,
      category: 'Heavy Freight Prime Mover',
      status: 'PENDING_NBE',
      bankRef: 'DASHO-LC-3392',
      approvalDate: 'In Review'
    }
  ]);

  const handleSimulateApprove = (id: string) => {
    setFxAllocations(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'APPROVED', approvalDate: 'Just Approved', queueNumber: 0 }
          : item
      )
    );
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
        {fxAllocations.map(alloc => (
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
                    onClick={() => handleSimulateApprove(alloc.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    <Clock className="w-3 h-3 text-amber-300" />
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
