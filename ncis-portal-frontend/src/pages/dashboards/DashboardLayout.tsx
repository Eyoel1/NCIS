import React from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import {
  ShieldAlert,
  Package,
  Ship,
  Anchor,
  Scale,
  Truck,
  Landmark,
  Award,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
    const role = user?.role || 'SUPER_ADMIN';
    const target = `/dashboard/${role.toLowerCase().replace(/_/g, '-')}`;
    return <Navigate to={target} replace />;
  }

  const roleNav = [
    { to: '/dashboard/super-admin', role: 'SUPER_ADMIN', label: t('roles.SUPER_ADMIN', 'Super Admin'), icon: ShieldAlert },
    { to: '/dashboard/importer-supplier', role: 'IMPORTER_SUPPLIER', label: t('roles.IMPORTER_SUPPLIER', 'Importer'), icon: Package },
    { to: '/dashboard/shipping-company', role: 'SHIPPING_COMPANY', label: t('roles.SHIPPING_COMPANY', 'Shipping Line'), icon: Ship },
    { to: '/dashboard/port-operator', role: 'PORT_OPERATOR', label: t('roles.PORT_OPERATOR', 'Port Terminal'), icon: Anchor },
    { to: '/dashboard/customs-authority', role: 'CUSTOMS_AUTHORITY', label: t('roles.CUSTOMS_AUTHORITY', 'Customs ECC'), icon: Scale },
    { to: '/dashboard/transport-forwarder', role: 'TRANSPORT_FORWARDER', label: t('roles.TRANSPORT_FORWARDER', 'Forwarder'), icon: Truck },
    { to: '/dashboard/financial-insurance', role: 'FINANCIAL_INSURANCE', label: t('roles.FINANCIAL_INSURANCE', 'Finance & L/C'), icon: Landmark },
    { to: '/dashboard/vehicle-registration', role: 'VEHICLE_REGISTRATION', label: t('roles.VEHICLE_REGISTRATION', 'Registration FTA'), icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Stakeholder Navigation Sub-Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm sticky top-16 z-30 overflow-x-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 min-w-max">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">
            Workspaces:
          </span>
          {roleNav.map((item) => {
            const isActive = location.pathname.includes(item.to.split('/')[2]);
            const isUserRole = user?.role === item.role;
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md'
                    : isUserRole
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {isUserRole && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};
