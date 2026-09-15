import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { Shield, ChevronDown, Check, UserCheck, Key } from 'lucide-react';

const ROLE_ICONS: Record<UserRole, string> = {
  SUPER_ADMIN: '🛡️',
  IMPORTER_SUPPLIER: '📦',
  SHIPPING_COMPANY: '🚢',
  PORT_OPERATOR: '🏗️',
  CUSTOMS_AUTHORITY: '⚖️',
  TRANSPORT_FORWARDER: '🚛',
  FINANCIAL_INSURANCE: '🏦',
  VEHICLE_REGISTRATION: '📋',
};

export const DemoRoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roles = Object.keys(DEMO_USERS) as UserRole[];
  const currentRole = user?.role || 'SUPER_ADMIN';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef} data-testid="demo-role-switcher">
      <button
        type="button"
        data-testid="role-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500/50 text-xs font-semibold text-slate-200 transition-all shadow-sm group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30">
          {ROLE_ICONS[currentRole]}
        </span>
        <span className="hidden sm:inline text-slate-400 font-normal">Role:</span>
        <span className="text-white font-semibold max-w-[140px] truncate">
          {t(`roles.${currentRole}`, DEMO_USERS[currentRole].fullName)}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          data-testid="role-switcher-menu"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          {/* Header indicator */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Key className="h-3 w-3 text-amber-400" />
              Demo 2FA Bypass: <code className="text-amber-300 font-mono">123456</code>
            </span>
            <span className="text-sky-400 font-semibold uppercase tracking-wider text-[10px] bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/40">
              8 Roles
            </span>
          </div>

          <div className="py-1 max-h-80 overflow-y-auto divide-y divide-slate-800/40">
            {roles.map((role) => {
              const info = DEMO_USERS[role];
              const isSelected = role === currentRole;
              return (
                <button
                  key={role}
                  type="button"
                  data-testid={`role-select-${role}`}
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-sky-950/70 text-white font-semibold border-l-2 border-sky-500'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{ROLE_ICONS[role]}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-100">
                        {t(`roles.${role}`, info.role)}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                        {info.fullName} • {info.organization}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
