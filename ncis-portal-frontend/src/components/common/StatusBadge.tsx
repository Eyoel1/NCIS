import React from 'react';
import { DelayRisk, ShipmentStage } from '../../types';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';

  const s = status.toUpperCase();

  if (['CLEARED', 'PAID', 'PASSED', 'APPROVED', 'LOW', 'GREEN'].includes(s)) {
    bg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (['SHIPPING', 'AT_SEA', 'MARITIME', 'MEDIUM'].includes(s)) {
    bg = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  } else if (['PENDING', 'CUSTOMS', 'PORT_OPERATIONS', 'IN_REVIEW', 'YELLOW', 'HIGH'].includes(s)) {
    bg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (['DISPUTED', 'CRITICAL', 'FAILED', 'REJECTED', 'RED', 'UNPAID'].includes(s)) {
    bg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (['DELIVERY', 'DELIVERED'].includes(s)) {
    bg = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
  } else if (['PRE_IMPORT', 'DRAFT'].includes(s)) {
    bg = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${bg} ${sizeClass} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
