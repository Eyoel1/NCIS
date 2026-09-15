import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NcisLogo } from '../brand/NcisLogo';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Activity, BarChart3, Navigation, Menu, X, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rolePath = user ? `/dashboard/${user.role.toLowerCase().replace(/_/g, '-')}` : '/dashboard/admin';

  const navLinks = [
    { to: rolePath, label: t('nav.dashboard', 'Dashboard'), icon: Activity },
    { to: '/track/ET-SHP-2026-001', label: t('nav.tracker', 'Live Tracker'), icon: Navigation },
    { to: '/statistics', label: t('nav.statistics', 'National Statistics'), icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Subtle Ethiopian Flag Header Accent Line */}
      <div className="h-0.5 w-full flex">
        <div className="flex-1 bg-emerald-500" />
        <div className="flex-1 bg-amber-400" />
        <div className="flex-1 bg-rose-500" />
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <NcisLogo size={36} />
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.to.split('/')[1]);
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-800/90 text-sky-400 border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link
            to="/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition shadow-xs"
          >
            Portal Login
          </Link>
        </nav>

        {/* Right: Controls (Role Switcher, Language, Theme Toggle) */}
        <div className="flex items-center gap-2.5">
          <DemoRoleSwitcher />
          <LanguageToggle />
          <ThemeToggle />

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Icon className="h-4 w-4 text-sky-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
