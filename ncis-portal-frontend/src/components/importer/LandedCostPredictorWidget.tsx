import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, HelpCircle } from 'lucide-react';

export const LandedCostPredictorWidget: React.FC = () => {
  const [fobUsd, setFobUsd] = useState(24000);
  const [freightUsd, setFreightUsd] = useState(2800);
  const [insuranceUsd, setInsuranceUsd] = useState(400);
  const fxRate = 125; // 125 ETB / USD

  const cifUsd = fobUsd + freightUsd + insuranceUsd;
  const cifEtb = cifUsd * fxRate;

  // Passenger vehicle rates: 35% duty, 30% excise, 15% VAT, 10% surtax, 3% withholding
  const customsDuty = cifEtb * 0.35;
  const exciseTax = (cifEtb + customsDuty) * 0.30;
  const vat = (cifEtb + customsDuty + exciseTax) * 0.15;
  const surtax = (cifEtb + customsDuty + exciseTax) * 0.10;
  const withholding = cifEtb * 0.03;
  const totalTaxes = customsDuty + exciseTax + vat + surtax + withholding;

  const portHandlingEtb = 45000;
  const corridorTruckingEtb = 95000;
  const motlInspectionEtb = 15000;
  const logisticsTotal = portHandlingEtb + corridorTruckingEtb + motlInspectionEtb;

  const netLandedCostEtb = cifEtb + totalTaxes + logisticsTotal;
  const estimatedMarketPriceEtb = netLandedCostEtb * 1.25; // 25% dealer markup
  const profitMarginEtb = estimatedMarketPriceEtb - netLandedCostEtb;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Total Landed Cost Breakdown & Market Profit Margin Predictor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              End-to-end unit cost calculation covering foreign purchase, all 5 customs taxes, and corridor logistics
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900">
          Projected ROI: +25.0%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">1. CIF Value (ETB)</span>
          <span className="text-base font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
            {Math.round(cifEtb).toLocaleString()} ETB
          </span>
          <span className="text-[10px] text-slate-500 font-mono">(${cifUsd.toLocaleString()} USD @ 125)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">2. Total Customs Taxes</span>
          <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
            {Math.round(totalTaxes).toLocaleString()} ETB
          </span>
          <span className="text-[10px] text-slate-500">Duty + Excise + VAT + Sur + WHT</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">3. Port & Trucking</span>
          <span className="text-base font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
            {logisticsTotal.toLocaleString()} ETB
          </span>
          <span className="text-[10px] text-slate-500">Doraleh + Modjo + Kality</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block uppercase">
            Net Landed Cost
          </span>
          <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 block mt-0.5">
            {Math.round(netLandedCostEtb).toLocaleString()} ETB
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Addis Ababa Gate</span>
        </div>
      </div>

      {/* Projected Profit Margin Bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Addis Ababa Retail Fair Market Value:
          </span>
          <span className="text-lg font-mono font-black text-slate-900 dark:text-white">
            {Math.round(estimatedMarketPriceEtb).toLocaleString()} ETB
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
              Estimated Dealership Profit:
            </span>
            <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +{Math.round(profitMarginEtb).toLocaleString()} ETB
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>
      </div>
    </div>
  );
};
