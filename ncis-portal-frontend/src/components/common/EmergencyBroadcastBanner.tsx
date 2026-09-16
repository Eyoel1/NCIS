import React from 'react';
import { useShipments } from '../../context/ShipmentContext';
import { Megaphone, X } from 'lucide-react';

export const EmergencyBroadcastBanner: React.FC = () => {
  const { flashBulletin, godModeBroadcastBulletin } = useShipments();

  if (!flashBulletin) return null;

  return (
    <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 shadow-md z-50 no-print animate-fade-in-up">
      <div className="flex items-center gap-2 mx-auto">
        <Megaphone className="w-4 h-4 animate-bounce shrink-0" />
        <span className="font-black uppercase tracking-wider font-mono bg-black/20 px-2 py-0.5 rounded text-[10px]">
          National Command Flash Directive
        </span>
        <span className="font-medium">{flashBulletin}</span>
      </div>
      <button
        onClick={() => godModeBroadcastBulletin(null)}
        className="text-amber-100 hover:text-white p-1 rounded hover:bg-black/10 transition"
        title="Dismiss Directive"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
