import React from 'react';
import { Circle, Popup } from 'react-leaflet';
import { PortCongestionInfo } from '../../types';
import { Anchor, Clock, AlertTriangle, Building2 } from 'lucide-react';

interface PortCongestionHeatmapProps {
  ports: PortCongestionInfo[];
}

export const PortCongestionHeatmap: React.FC<PortCongestionHeatmapProps> = ({ ports }) => {
  return (
    <>
      {ports.map((port) => (
        <Circle
          key={port.id}
          center={[port.lat, port.lng]}
          radius={port.radius}
          pathOptions={{
            color: port.color,
            fillColor: port.color,
            fillOpacity: 0.18,
            weight: 2,
            dashArray: '4, 4',
          }}
        >
          <Popup>
            <div className="p-1 min-w-[200px]">
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-700">
                <Anchor className="h-4 w-4 text-sky-400" />
                <span className="font-bold text-xs text-white">{port.name}</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Congestion Level:</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                      port.status === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : port.status === 'ELEVATED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {port.congestionIndex}% ({port.status})
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg Dwell Time:</span>
                  <span className="font-mono text-white font-semibold">
                    {port.dwellTimeDays} days
                  </span>
                </div>

                {port.waitingVessels !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Vessels in Queue:</span>
                    <span className="font-mono text-sky-300 font-semibold">
                      {port.waitingVessels} ships
                    </span>
                  </div>
                )}

                {port.customsQueue !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Customs Queue:</span>
                    <span className="font-mono text-amber-300 font-semibold">
                      {port.customsQueue} declarations
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
};
