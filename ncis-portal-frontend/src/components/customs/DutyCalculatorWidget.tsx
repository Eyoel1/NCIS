import React, { useState, useEffect } from 'react';
import { DutyCalculationInput, DutyCalculationResult, FuelType } from '../../types';
import { computeEthiopianCustomsDuty } from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';
import { Calculator, DollarSign, Percent, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface DutyCalculatorWidgetProps {
  initialCif?: number;
  initialCc?: number;
  initialFuel?: FuelType;
  onApplyDuty?: (result: DutyCalculationResult) => void;
}

export const DutyCalculatorWidget: React.FC<DutyCalculatorWidgetProps> = ({
  initialCif = 2500000,
  initialCc = 1800,
  initialFuel = 'PETROL',
  onApplyDuty,
}) => {
  const { t } = useTranslation();

  const [cifValue, setCifValue] = useState<number>(initialCif);
  const [engineCc, setEngineCc] = useState<number>(initialCc);
  const [fuelType, setFuelType] = useState<FuelType>(initialFuel);
  const [category, setCategory] = useState<'PASSENGER' | 'COMMERCIAL' | 'MOTORCYCLE'>('PASSENGER');

  const [result, setResult] = useState<DutyCalculationResult>(() =>
    computeEthiopianCustomsDuty({
      cifValue: initialCif,
      engineCapacityCc: initialCc,
      fuelType: initialFuel,
      vehicleCategory: 'PASSENGER',
    })
  );

  const calculate = () => {
    const res = computeEthiopianCustomsDuty({
      cifValue,
      engineCapacityCc: engineCc,
      fuelType,
      vehicleCategory: category,
    });
    setResult(res);
    if (onApplyDuty) onApplyDuty(res);
  };

  // Recompute automatically when inputs change
  useEffect(() => {
    calculate();
  }, [cifValue, engineCc, fuelType, category]);

  return (
    <div
      data-testid="duty-calculator-widget"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {t('customs.calculate', 'Ethiopian Customs Tariff Engine')}
            </h3>
            <p className="text-xs text-slate-400">
              Proclamations 859/2014 & 1186/2020 (Cascading Tariff Computation)
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="btn-calculate"
          onClick={calculate}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow transition-colors flex items-center gap-1.5"
        >
          <span>Recalculate</span>
        </button>
      </div>

      {/* Input Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('customs.cif', 'CIF Value (ETB)')}
          </label>
          <div className="relative">
            <input
              type="number"
              data-testid="input-cif"
              value={cifValue}
              onChange={(e) => setCifValue(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              placeholder="e.g. 2500000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('vehicle.engineCc', 'Engine Capacity (cc)')}
          </label>
          <input
            type="number"
            data-testid="input-engine-cc"
            value={engineCc}
            disabled={fuelType === 'ELECTRIC'}
            onChange={(e) => setEngineCc(Math.max(0, Number(e.target.value)))}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
            placeholder="e.g. 1800"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t('vehicle.fuelType', 'Powertrain / Fuel')}
          </label>
          <select
            data-testid="select-fuel-type"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          >
            <option value="PETROL">Petrol (Internal Combustion)</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRID">Hybrid (Gas / Electric)</option>
            <option value="ELECTRIC">All-Electric (5% Flat Incentive)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Classification
          </label>
          <select
            data-testid="select-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          >
            <option value="PASSENGER">Standard Passenger Car (35% Duty)</option>
            <option value="COMMERCIAL">Commercial Freight / Truck (10% Duty)</option>
            <option value="MOTORCYCLE">Motorcycle (30% Duty)</option>
          </select>
        </div>
      </div>

      {/* Cascading Tax Breakdown Table */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="px-4 py-2.5">Tax Component</th>
              <th className="px-4 py-2.5">Applicable Rate</th>
              <th className="px-4 py-2.5">Assessment Basis</th>
              <th className="px-4 py-2.5 text-right">Duty Amount (ETB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
            <tr>
              <td className="px-4 py-2 font-sans font-medium text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Customs Duty
              </td>
              <td className="px-4 py-2 text-sky-400">{(result.dutyRate * 100).toFixed(0)}%</td>
              <td className="px-4 py-2 text-slate-400">CIF Value</td>
              <td className="px-4 py-2 text-right font-bold" data-testid="result-duty">
                {result.dutyAmount.toLocaleString()} ETB
              </td>
            </tr>

            <tr>
              <td className="px-4 py-2 font-sans font-medium text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Excise Tax
              </td>
              <td className="px-4 py-2 text-amber-400">{(result.exciseRate * 100).toFixed(0)}%</td>
              <td className="px-4 py-2 text-slate-400">CIF + Duty</td>
              <td className="px-4 py-2 text-right font-bold" data-testid="result-excise">
                {result.exciseAmount.toLocaleString()} ETB
              </td>
            </tr>

            <tr>
              <td className="px-4 py-2 font-sans font-medium text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Value Added Tax (VAT)
              </td>
              <td className="px-4 py-2 text-emerald-400">15%</td>
              <td className="px-4 py-2 text-slate-400">CIF + Duty + Excise</td>
              <td className="px-4 py-2 text-right font-bold" data-testid="result-vat">
                {result.vatAmount.toLocaleString()} ETB
              </td>
            </tr>

            <tr>
              <td className="px-4 py-2 font-sans font-medium text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Surtax
              </td>
              <td className="px-4 py-2 text-purple-400">10%</td>
              <td className="px-4 py-2 text-slate-400">CIF + Duty + Excise</td>
              <td className="px-4 py-2 text-right font-bold" data-testid="result-surtax">
                {result.surtaxAmount.toLocaleString()} ETB
              </td>
            </tr>

            <tr>
              <td className="px-4 py-2 font-sans font-medium text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Withholding Tax
              </td>
              <td className="px-4 py-2 text-teal-400">3%</td>
              <td className="px-4 py-2 text-slate-400">CIF Value</td>
              <td className="px-4 py-2 text-right font-bold" data-testid="result-withholding">
                {result.withholdingAmount.toLocaleString()} ETB
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-sky-950/40 border-t-2 border-sky-800/80 font-bold text-sm">
              <td colSpan={3} className="px-4 py-3 text-white font-sans">
                {t('customs.total', 'Total Duties & Taxes Payable')}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sky-300 text-base" data-testid="result-total">
                {result.totalPayable.toLocaleString()} ETB
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
