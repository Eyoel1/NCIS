import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { CorridorMap } from '../components/map/CorridorMap';
import { MOCK_SHIPMENTS } from '../services/mockData';
import { UserRole } from '../types';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Ship,
  Truck,
  FileText,
  BarChart2,
  Layers,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { switchRole } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/track/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickRole = (role: UserRole) => {
    switchRole(role);
    navigate(`/dashboard/${role.toLowerCase().replace(/_/g, '-')}`);
  };

  const roles = Object.keys(DEMO_USERS) as UserRole[];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[300px] h-[200px] bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          {/* Sovereign Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-sky-400 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            <span>Federal Democratic Republic of Ethiopia • National Supply Chain</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Single-Window Transparency for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
              Ethiopia’s Vehicle Imports
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300">
            End-to-end multi-modal logistics from Dubai and the Red Sea seaports (Djibouti & Berbera) through Modjo Dry Port to final Addis Ababa registration.
          </p>

          {/* Instant VIN / Tracking Lookup Form */}
          <form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto mt-6 flex flex-col sm:flex-row items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-700/80 shadow-2xl focus-within:border-sky-500 transition-colors"
          >
            <div className="flex items-center gap-2.5 px-3 flex-1 w-full">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Chassis VIN or Tracking Number (e.g. ET-SHP-2026-001)"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none font-mono py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Track Shipment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Sample quick search pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 pt-2">
            <span>Try sample tracking:</span>
            <button
              type="button"
              onClick={() => navigate('/track/ET-SHP-2026-001')}
              className="font-mono text-sky-400 hover:text-sky-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              ET-SHP-2026-001 (Prado)
            </button>
            <button
              type="button"
              onClick={() => navigate('/track/JTJHY7AX8N4029182')}
              className="font-mono text-emerald-400 hover:text-emerald-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              VIN: JTJHY7AX8N...
            </button>
            <button
              type="button"
              onClick={() => navigate('/track/ET-SHP-2026-004')}
              className="font-mono text-amber-400 hover:text-amber-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              ET-SHP-2026-004 (BYD EV)
            </button>
          </div>
        </div>
      </section>

      {/* Live National Metrics Ticker Bar */}
      <section className="bg-slate-900/60 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">14,820+</span>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Vehicles Cleared YTD
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">95% / 5%</span>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Djibouti vs Berbera Throughput
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">5.4 Days</span>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Average Customs Clearance
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</span>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Cryptographic Audit Chain
            </p>
          </div>
        </div>
      </section>

      {/* Corridor Map Preview Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl w-full">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Live GIS Geographic Overview
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">
              Horn of Africa Import Corridor
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time monitoring of maritime feeder lanes from Jebel Ali to Port of Djibouti and Berbera, alongside the multi-modal road and rail transit routes into Modjo and Addis Ababa.
            </p>
          </div>

          <Link
            to="/statistics"
            className="flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
            <span>View National Transparency Statistics</span>
          </Link>
        </div>

        <CorridorMap shipments={MOCK_SHIPMENTS} height="480px" />
      </section>

      {/* 8 Stakeholder Portals Quick-Access Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Unified Stakeholder Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Dedicated Stakeholder Dashboards
            </h2>
            <p className="text-xs text-slate-400">
              Select any role below to launch the role-personalized dashboard instantly with pre-authenticated demo bypass.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => {
              const u = DEMO_USERS[role];
              return (
                <div
                  key={role}
                  onClick={() => handleQuickRole(role)}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/60 p-4 rounded-xl cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/50">
                      {role.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    {t(`roles.${role}`, u.fullName)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {u.organization}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>1-Click Launch</span>
                    <span className="font-mono text-slate-400">{u.email}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500">
        <p>Federal Democratic Republic of Ethiopia • Ministry of Transport & Logistics • Ethiopian Customs Commission</p>
        <p className="mt-1">NCIS Portal © 2026. Secure single-window digital governance platform.</p>
      </footer>
    </div>
  );
};
