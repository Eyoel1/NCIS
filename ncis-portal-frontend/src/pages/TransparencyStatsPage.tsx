import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
  Anchor,
  Clock,
  DollarSign,
  Download,
} from 'lucide-react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const TransparencyStatsPage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getStatistics();
        setStats(data);
      } catch {
        // Handled in api fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const DWELL_TIME_TRENDS = [
    { month: 'Apr', djibouti: 4.6, berbera: 2.4, modjo: 3.8 },
    { month: 'May', djibouti: 4.4, berbera: 2.3, modjo: 3.7 },
    { month: 'Jun', djibouti: 4.5, berbera: 2.1, modjo: 3.6 },
    { month: 'Jul', djibouti: 4.3, berbera: 2.2, modjo: 3.5 },
    { month: 'Aug', djibouti: 4.1, berbera: 2.0, modjo: 3.4 },
    { month: 'Sep', djibouti: 4.2, berbera: 2.1, modjo: 3.5 },
  ];

  const REVENUE_DISTRIBUTION = [
    { month: 'Apr', duty: 420, excise: 580, vat: 310, surtax: 210 },
    { month: 'May', duty: 450, excise: 620, vat: 330, surtax: 220 },
    { month: 'Jun', duty: 480, excise: 660, vat: 350, surtax: 230 },
    { month: 'Jul', duty: 510, excise: 700, vat: 380, surtax: 250 },
    { month: 'Aug', duty: 540, excise: 750, vat: 400, surtax: 270 },
    { month: 'Sep', duty: 580, excise: 810, vat: 430, surtax: 290 },
  ];

  const FUEL_DATA = [
    { name: 'Diesel', value: 54.2, color: '#f59e0b' },
    { name: 'Petrol', value: 32.1, color: '#0284c7' },
    { name: 'Hybrid', value: 7.5, color: '#10b981' },
    { name: 'Electric (EV)', value: 6.2, color: '#38bdf8' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-sky-400" />
            <h1 className="text-2xl font-black text-white tracking-wide">
              {t('nav.statistics', 'National Vehicle Import Transparency Portal')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official real-time analytics on clearance velocity, customs revenue collection, and clean vehicle adoption in Ethiopia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live National Registry Stream
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            Total Cleared Units
          </div>
          <span className="text-3xl font-black text-white font-mono">14,825</span>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">+14.2% YoY Throughput</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Duty Revenue Assessed
          </div>
          <span className="text-3xl font-black text-white font-mono">8.95B</span>
          <span className="text-xs text-slate-400 ml-1">ETB</span>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">100% Digital Realization</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Avg Clearance Dwell
          </div>
          <span className="text-3xl font-black text-white font-mono">5.4</span>
          <span className="text-xs text-slate-400 ml-1">Days</span>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">-3.2 days vs 2024 baseline</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap className="h-4 w-4 text-purple-400" />
            EV & Hybrid Share
          </div>
          <span className="text-3xl font-black text-white font-mono">13.7%</span>
          <p className="text-[11px] text-sky-400 mt-1 font-medium">Accelerated by 5% tax incentive</p>
        </div>
      </div>

      {/* Row 1: Bar Chart (Imports by Make) & Pie Chart (Fuel/Powertrain) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Imports by Make */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Import Volume by Vehicle Manufacturer
            </h3>
            <p className="text-xs text-slate-400">Total verified chassis count processed through Ethiopian ports</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.importsByMake || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="make" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Powertrain Distribution */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Powertrain & Fuel Transition
            </h3>
            <p className="text-xs text-slate-400">Diesel vs Petrol vs Clean Electric/Hybrid Vehicles</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={FUEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {FUEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value}%`, 'Market Share']}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Port Dwell Time Trends & Customs Revenue Realization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dwell Time Comparison */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Port & Terminal Dwell Time Trends (Days)
            </h3>
            <p className="text-xs text-slate-400">Comparing Port of Djibouti, Port of Berbera, and Modjo Dry Port</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DWELL_TIME_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="d" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend formatter={(value) => <span className="text-xs text-slate-300 capitalize">{value}</span>} />
                <Line type="monotone" dataKey="djibouti" name="Djibouti Port" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="berbera" name="Berbera Port" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="modjo" name="Modjo Dry Port" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Collection Trends */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Customs Tax Revenue Breakdown (Million ETB)
            </h3>
            <p className="text-xs text-slate-400">Cascading realization: Duty, Excise Tax, VAT (15%), Surtax (10%)</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DISTRIBUTION} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="M" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend formatter={(value) => <span className="text-xs text-slate-300 uppercase">{value}</span>} />
                <Area type="monotone" dataKey="duty" stackId="1" stroke="#0284c7" fill="#0284c7" fillOpacity={0.6} />
                <Area type="monotone" dataKey="excise" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="vat" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="surtax" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
