import React, { useState, useRef, useEffect } from 'react';
import { useShipments } from '../../context/ShipmentContext';
import { Bell, Check, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markNotificationRead, clearAllNotifications } = useShipments();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {/* Live Notification Bell & Drawer */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl border border-slate-700/60 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition shadow-xs"
              title="Live Multi-Agency Activity Stream"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-[99999] overflow-hidden animate-fade-in-up text-xs">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Live Agency Activity Feed</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-[11px]">
                      No new activity notifications.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-2.5 ${
                          !n.read ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'DANGER' ? 'bg-rose-500' : n.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-brand-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white truncate text-[11px]">{n.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{n.message}</p>
                          <div className="mt-1 text-[9px] text-slate-400 font-mono">
                            By <strong>{n.actor}</strong> ({n.role})
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
