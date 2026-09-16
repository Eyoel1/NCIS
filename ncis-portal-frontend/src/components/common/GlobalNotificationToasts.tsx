import React, { useState, useEffect } from 'react';
import { useShipments } from '../../context/ShipmentContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export const GlobalNotificationToasts: React.FC = () => {
  const { notifications } = useShipments();
  const [visibleToasts, setVisibleToasts] = useState<typeof notifications>([]);

  // When a new notification arrives, show as toast for 6 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setVisibleToasts(prev => {
        if (prev.find(t => t.id === latest.id)) return prev;
        return [latest, ...prev.slice(0, 2)];
      });

      const timer = setTimeout(() => {
        setVisibleToasts(prev => prev.filter(t => t.id !== latest.id));
      }, 5500);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const dismissToast = (id: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 z-[9999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print">
      {visibleToasts.map(toast => {
        const isSuccess = toast.type === 'SUCCESS';
        const isDanger = toast.type === 'DANGER';
        const isWarning = toast.type === 'WARNING';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-fade-in-up transition-all flex items-start gap-3 ${
              isDanger
                ? 'bg-rose-950/95 border-rose-800 text-white'
                : isSuccess
                ? 'bg-emerald-950/95 border-emerald-800 text-white'
                : isWarning
                ? 'bg-amber-950/95 border-amber-800 text-white'
                : 'bg-slate-950/95 border-slate-800 text-white'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isDanger ? (
                <AlertOctagon className="w-5 h-5 text-rose-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <Info className="w-5 h-5 text-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold truncate">{toast.title}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{toast.message}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                <span className="font-semibold text-slate-200">{toast.actor}</span>
                <span>•</span>
                <span className="font-mono uppercase">{toast.role}</span>
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
