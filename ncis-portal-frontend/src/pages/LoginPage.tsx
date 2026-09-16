
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, UserCheck, KeyRound, Building2, User, Phone, ArrowRight, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { NcisLogo } from '../components/brand/NcisLogo';

export const SEED_USERS_LIST: { email: string; role: UserRole; roleLabel: string; name: string; org: string; password: string }[] = [
  {
    email: 'admin@ncis.gov.et',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    name: 'Abebe Bekele',
    org: 'National Command / PMO',
    password: 'Demo@2026!'
  },
  {
    email: 'customs@ecc.gov.et',
    role: 'CUSTOMS_AUTHORITY',
    roleLabel: 'Customs Authority',
    name: 'Hiwot Girma',
    org: 'Ethiopian Customs Commission (ECC)',
    password: 'Demo@2026!'
  },
  {
    email: 'cbe.finance@cbe.com.et',
    role: 'FINANCIAL_INSURANCE',
    roleLabel: 'Finance & Banking',
    name: 'Selamawit Desta',
    org: 'Commercial Bank of Ethiopia',
    password: 'Demo@2026!'
  },
  {
    email: 'importer@ethioimport.com',
    role: 'IMPORTER_SUPPLIER',
    roleLabel: 'Importer / Supplier',
    name: 'Dawit Haile',
    org: 'Ethio-Red Sea Motors PLC',
    password: 'Demo@2026!'
  },
  {
    email: 'port@djibouti-port.com',
    role: 'PORT_OPERATOR',
    roleLabel: 'Port Operator',
    name: 'Moustapha Omar',
    org: 'Djibouti Doraleh Port Authority',
    password: 'Demo@2026!'
  },
  {
    email: 'forwarder@ethio-transit.com',
    role: 'TRANSPORT_FORWARDER',
    roleLabel: 'Transport Forwarder',
    name: 'Solomon Getachew',
    org: 'Trans-Ethiopia Logistics S.C.',
    password: 'Demo@2026!'
  },
  {
    email: 'fta@motl.gov.et',
    role: 'VEHICLE_REGISTRATION',
    roleLabel: 'Vehicle Registration',
    name: 'Eng. Birhanu Alemu',
    org: 'Federal Transport Authority (MOTL)',
    password: 'Demo@2026!'
  },
  {
    email: 'shipping@ethiopian-shipping.com',
    role: 'SHIPPING_COMPANY',
    roleLabel: 'Shipping Carrier',
    name: 'Captain Yared Tadesse',
    org: 'Ethiopian Shipping Line (ESLSE)',
    password: 'Demo@2026!'
  }
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, register, logout, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOrg, setSignupOrg] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('IMPORTER_SUPPLIER');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  // Copied state for feedback
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const getRolePath = (role: UserRole): string => {
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
    return rolePaths[role] || '/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(loginEmail.trim(), loginPassword, twoFactorCode);
      if (success) {
        // Check stored role or matched seed or fallback
        const storedRole = localStorage.getItem('ncis_role') as UserRole;
        const matched = SEED_USERS_LIST.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
        const targetRole = storedRole || (matched ? matched.role : 'IMPORTER_SUPPLIER');
        navigate(getRolePath(targetRole));
      } else {
        setLoginError('Invalid credentials. Please verify your email or click 1-Click Login below.');
      }
    } catch {
      setLoginError('Authentication service unreachable. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('Please fill in all required fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: signupName.trim(),
        email: signupEmail.trim(),
        role: signupRole,
        organization: signupOrg.trim() || undefined,
        phone: signupPhone.trim() || undefined,
      });
      navigate(getRolePath(signupRole));
    } catch {
      setSignupError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (seed: typeof SEED_USERS_LIST[0]) => {
    setLoginEmail(seed.email);
    setLoginPassword(seed.password);
    setCopiedEmail(seed.email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ethiopian Tricolor Top Accent */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-emerald-500" />
        <div className="flex-1 bg-amber-500" />
        <div className="flex-1 bg-rose-500" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">

          {/* Left Column: Form (Sign In / Sign Up) - 7 cols */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <NcisLogo size={36} />
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('LOGIN')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'LOGIN'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('SIGNUP')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'SIGNUP'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Active User Notification if already signed in */}
            {user && (
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">{user.fullName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-300 font-mono text-[9px] font-bold">
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user.organization || user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(getRolePath(user.role))}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {activeTab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-white">Sign In to National Single Window</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your authorized agency credentials or choose from the seed accounts list
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                    {loginError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. customs@ecc.gov.et or admin@ncis.gov.et"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        2FA Authenticator Code
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">
                        Demo Bypass: 123456
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs font-mono tracking-widest focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {activeTab === 'SIGNUP' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div>
                  <h2 className="text-base font-bold text-white">Register New Trade / Agency Account</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create an institutional user account to access the national clearance workspace
                  </p>
                </div>

                {signupError && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                    {signupError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Yonas Mulugeta"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Organization / Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={signupOrg}
                        onChange={(e) => setSignupOrg(e.target.value)}
                        placeholder="e.g. Abyssinia Auto Trade"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Stakeholder Role *
                    </label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="IMPORTER_SUPPLIER">🏢 Importer / Dealership</option>
                      <option value="CUSTOMS_AUTHORITY">🏛️ Customs Commission (ECC)</option>
                      <option value="FINANCIAL_INSURANCE">🏦 Commercial Bank & Insurance</option>
                      <option value="PORT_OPERATOR">⚓ Port Terminal Operator</option>
                      <option value="TRANSPORT_FORWARDER">🚛 Transport & Freight Forwarder</option>
                      <option value="VEHICLE_REGISTRATION">📋 Vehicle Registration (MOTL)</option>
                      <option value="SHIPPING_COMPANY">🚢 Ocean Shipping Carrier</option>
                      <option value="SUPER_ADMIN">🌐 Super Admin / Oversight</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 active:scale-98 mt-2"
                >
                  <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration & Enter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Public Portal Services:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/overview')}
                  className="hover:text-sky-400 transition underline underline-offset-2"
                >
                  Corridor Map
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => navigate('/track/ET-SHP-2026-001')}
                  className="hover:text-sky-400 transition underline underline-offset-2"
                >
                  Live Tracker
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => navigate('/statistics')}
                  className="hover:text-sky-400 transition underline underline-offset-2"
                >
                  Statistics
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Seed Credentials Directory - 5 cols */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official Agency Directory</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Default PW: <strong className="text-amber-300 font-mono">Demo@2026!</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 mb-2.5">
                Click any agency to autofill credentials, or use <strong>1-Click Login</strong>:
              </p>

              {/* Seed users list */}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {SEED_USERS_LIST.map((seed) => {
                  const isCopied = copiedEmail === seed.email;
                  return (
                    <div
                      key={seed.email}
                      onClick={() => handleQuickFill(seed)}
                      className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 cursor-pointer transition-all card-hover-lift group flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-200 truncate group-hover:text-amber-300">
                            {seed.roleLabel}
                          </span>
                        </div>
                        <code className="text-[10px] text-slate-400 font-mono block truncate">
                          {seed.email}
                        </code>
                        <span className="text-[9px] text-slate-500 block truncate">
                          {seed.name} • {seed.org}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            switchRole(seed.role);
                            navigate(getRolePath(seed.role));
                          }}
                          className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] shadow-xs transition flex items-center gap-0.5"
                          title={`Sign in immediately as ${seed.roleLabel}`}
                        >
                          <span>Sign In</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickFill(seed);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Autofill this email and password"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400">
              💡 <strong>Instant Access:</strong> Any user can create their own custom account via the <strong>Create Account</strong> tab or click <strong>Sign In</strong> above!
            </div>
          </div>

        </div>
      </div>

      {/* Sovereign Footer */}
      <div className="py-3 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-slate-950/40">
        Federal Democratic Republic of Ethiopia • National Logistics Transformation Program
      </div>
    </div>
  );
};
