import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, KeyRound, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { NcisLogo } from '../components/brand/NcisLogo';

const ROLES_LIST: { role: UserRole; name: string; org: string; iconColor: string }[] = [
  { role: 'SUPER_ADMIN', name: 'Abebe Kebede', org: 'National Command / PMO', iconColor: 'text-indigo-500' },
  { role: 'CUSTOMS_AUTHORITY', name: 'Yohannes Wolde', org: 'Ethiopian Customs Commission', iconColor: 'text-emerald-500' },
  { role: 'FINANCIAL_INSURANCE', name: 'Selamawit Desta', org: 'Commercial Bank of Ethiopia', iconColor: 'text-purple-500' },
  { role: 'PORT_OPERATOR', name: 'Fatuma Omar', org: 'Djibouti Doraleh Terminal', iconColor: 'text-sky-500' },
  { role: 'TRANSPORT_FORWARDER', name: 'Dawit Haile', org: 'Trans-Ethiopia Logistics', iconColor: 'text-amber-500' },
  { role: 'VEHICLE_REGISTRATION', name: 'Biruk Assefa', org: 'Federal Transport Authority (MOTL)', iconColor: 'text-rose-500' },
  { role: 'IMPORTER_SUPPLIER', name: 'Alazar Tadesse', org: 'Ethio Auto Imports PLC', iconColor: 'text-teal-500' },
  { role: 'SHIPPING_COMPANY', name: 'Capt. Michael Chen', org: 'Horn Maritime Line', iconColor: 'text-blue-500' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole, user } = useAuth();
  const [email, setEmail] = useState('admin@ncis.gov.et');
  const [password, setPassword] = useState('••••••••••••');
  const [twoFactorCode, setTwoFactorCode] = useState('123456');

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    // Navigate to respective dashboard
    const rolePaths: Record<UserRole, string> = {
      SUPER_ADMIN: '/dashboard/super-admin',
      IMPORTER_SUPPLIER: '/dashboard/importer',
      SHIPPING_COMPANY: '/dashboard/shipping',
      PORT_OPERATOR: '/dashboard/port',
      CUSTOMS_AUTHORITY: '/dashboard/customs',
      TRANSPORT_FORWARDER: '/dashboard/forwarder',
      FINANCIAL_INSURANCE: '/dashboard/finance',
      VEHICLE_REGISTRATION: '/dashboard/registration',
    };
    navigate(rolePaths[role] || '/dashboard');
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRoleSelect('SUPER_ADMIN');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ethiopian Tricolor Top Accent */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-emerald-500" />
        <div className="flex-1 bg-amber-500" />
        <div className="flex-1 bg-rose-500" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Left Column: Branding & Credentials */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sovereign Trade Single Window v2.4</span>
              </div>

              <NcisLogo size={44} />

              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                National Car Import Supply Chain Management Platform — interconnecting Ethiopian Customs, Commercial Banks, Djibouti Port Terminal, and Federal Transport Authority into a unified cryptographic ledger.
              </p>
            </div>

            {/* Quick Demo Mode Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <KeyRound className="w-3.5 h-3.5" />
                  Evaluator Demo Mode
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                  2FA Bypass Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click any stakeholder role on the right to enter that agency's authenticated workspace with pre-populated live data.
              </p>
            </div>
          </div>

          {/* Right Column: 1-Click Role Access Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Instant Role Access (8 Stakeholders)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Launch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {ROLES_LIST.map(item => (
                <button
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-left transition-all card-hover-lift group"
                >
                  <span className="text-[11px] font-bold text-white block group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                    {item.org}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500 group-hover:text-emerald-400 mt-1">
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                ← Return to Public Corridor Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-slate-950/40">
        Federal Democratic Republic of Ethiopia • National Logistics Transformation Program
      </div>
    </div>
  );
};
