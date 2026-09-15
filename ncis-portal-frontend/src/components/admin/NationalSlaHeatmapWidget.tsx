import React from 'react';
import { Activity, Clock, CheckCircle2, AlertTriangle, Building2, TrendingDown } from 'lucide-react';

export const NationalSlaHeatmapWidget: React.FC = () => {
  const agencyMetrics = [
    {
      agency: 'Djibouti Doraleh Port Terminal (DCT)',
      stage: 'Vessel Discharging & Yard Storage',
      actualDwell: '4.2 Days',
      slaTarget: '3.0 Days',
      compliancePercent: 78,
      status: 'BOTTLENECK',
      notes: 'Berth 3 crane congestion causing 1.2-day delay'
    },
    {
      agency: 'Commercial Bank of Ethiopia (CBE)',
      stage: 'NBE FX Approval & L/C Issuance',
      actualDwell: '5.1 Days',
      slaTarget: '4.0 Days',
      compliancePercent: 71,
      status: 'BOTTLENECK',
      notes: 'Foreign currency queue wait times in review'
    },
    {
      agency: 'Ethiopian Customs Commission (ECC)',
      stage: 'Risk Channeling & Duty Assessment',
      actualDwell: '1.8 Days',
      slaTarget: '2.0 Days',
      compliancePercent: 94,
      status: 'OPTIMAL',
      notes: 'Green channel automated release operating efficiently'
    },
    {
      agency: 'Trans-Ethiopia Highway Convoy',
      stage: 'Galafi Border to Modjo Dry Port Transit',
      actualDwell: '32.4 Hours',
      slaTarget: '36.0 Hours',
      compliancePercent: 96,
      status: 'OPTIMAL',
      notes: 'Automated ECTS e-seal checkpoints reduced border dwell'
    },
    {
      agency: 'Ministry of Transport & Logistics (MOTL)',
      stage: 'Inspection & Title Libre Issuance',
      actualDwell: '0.8 Days',
      slaTarget: '1.0 Days',
      compliancePercent: 98,
      status: 'OPTIMAL',
      notes: 'Kality automated brake and emissions ramp operational'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              National Logistics Council — Inter-Agency Corridor SLA Performance Heatmap
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Macro-level trade bottleneck radar monitoring dwell times across Port, Customs, Banks, and Corridor
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
          Average National Dwell: 5.4 Days
        </span>
      </div>

      <div className="space-y-3">
        {agencyMetrics.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 card-hover-lift"
          >
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.agency}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    item.status === 'BOTTLENECK'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Stage: <strong>{item.stage}</strong>
              </p>
              <p className="text-[11px] text-slate-400 italic">
                {item.notes}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                  {item.actualDwell}
                </span>
                <span className="text-[10px] text-slate-400">
                  Target SLA: {item.slaTarget}
                </span>
              </div>

              <div className="w-24">
                <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-500">
                  <span>SLA</span>
                  <span className="font-bold">{item.compliancePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.compliancePercent > 90
                        ? 'bg-emerald-500'
                        : item.compliancePercent > 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.compliancePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
