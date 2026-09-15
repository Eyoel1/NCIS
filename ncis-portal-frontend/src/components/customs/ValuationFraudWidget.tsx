import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, RefreshCw, Scale } from 'lucide-react';

interface ValuationFraudWidgetProps {
  onApplyBenchmark?: (newCifEtb: number) => void;
}

export const ValuationFraudWidget: React.FC<ValuationFraudWidgetProps> = ({ onApplyBenchmark }) => {
  const [declaredCif, setDeclaredCif] = useState(2650000); // 2.65M ETB declared
  const officialBenchmark = 3850000; // 3.85M ETB official ECC catalog price for Toyota Prado 2024
  const [status, setStatus] = useState<'FLAGGED' | 'RESOLVED'>('FLAGGED');

  const discrepancyPercent = Math.round(((declaredCif - officialBenchmark) / officialBenchmark) * 100);
  const potentialDutyLoss = Math.round((officialBenchmark - declaredCif) * 0.64); // ~64% aggregate tax

  const handleApplyBenchmark = () => {
    setDeclaredCif(officialBenchmark);
    setStatus('RESOLVED');
    if (onApplyBenchmark) onApplyBenchmark(officialBenchmark);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ECC Statutory Valuation & Anti-Underinvoicing Risk Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated cross-check against Ethiopian Customs Commission Official Reference Price Database
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono ${
            status === 'FLAGGED'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
          }`}
        >
          {status === 'FLAGGED' ? '⚠️ Under-Invoicing Risk Flagged' : '✓ Reassessed to Statutory Minimum'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Declared Value */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase block mb-1">
            Importer Declared CIF (ETB)
          </span>
          <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
            {declaredCif.toLocaleString()} ETB
          </span>
          <span className="block text-[11px] text-slate-400 mt-0.5 font-mono">
            ~ ${Math.round(declaredCif / 125).toLocaleString()} USD (Invoice Value)
          </span>
        </div>

        {/* Official ECC Benchmark */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase block mb-1">
            Official ECC Catalog Benchmark
          </span>
          <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
            {officialBenchmark.toLocaleString()} ETB
          </span>
          <span className="block text-[11px] text-slate-400 mt-0.5 font-mono">
            Directives Schedule 2024/09 (Toyota Prado 2.8L)
          </span>
        </div>

        {/* Discrepancy & Revenue Impact */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 uppercase block mb-1">
            Valuation Discrepancy
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-mono font-bold ${
                status === 'FLAGGED' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {status === 'FLAGGED' ? `${discrepancyPercent}%` : '0% (Aligned)'}
            </span>
            {status === 'FLAGGED' && (
              <span className="text-[11px] text-rose-500 font-medium">
                (-{potentialDutyLoss.toLocaleString()} ETB duty leakage)
              </span>
            )}
          </div>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            {status === 'FLAGGED' ? 'Red flag for revenue audit' : 'Statutory tariff base locked'}
          </span>
        </div>
      </div>

      {status === 'FLAGGED' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
          <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Customs Warning:</strong> Declared CIF is 31% below standard market value. Importer must provide proof of payment or agree to benchmark assessment.
            </span>
          </div>
          <button
            onClick={handleApplyBenchmark}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Apply Statutory Benchmark Override</span>
          </button>
        </div>
      )}
    </div>
  );
};
