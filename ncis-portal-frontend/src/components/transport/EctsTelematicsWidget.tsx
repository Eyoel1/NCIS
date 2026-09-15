import React, { useState } from 'react';
import { Truck, ShieldCheck, BatteryCharging, Wifi, AlertTriangle, MapPin, Radio } from 'lucide-react';

export const EctsTelematicsWidget: React.FC = () => {
  const [convoys] = useState([
    {
      id: 'CNV-01',
      truckPlate: '3-B92014 ET',
      driver: 'Kassahun Bekele',
      destination: 'Modjo Dry Port',
      sealId: 'ECTS-ET-88924',
      batteryPercent: 92,
      sealStatus: 'LOCKED_SECURE',
      speedKmh: 64,
      currentLocation: 'Awash Arba Checkpoint',
      geofenceAlarm: false
    },
    {
      id: 'CNV-02',
      truckPlate: '3-A88204 ET',
      driver: 'Mulugeta Tadesse',
      destination: 'Kality Depot',
      sealId: 'ECTS-ET-77102',
      batteryPercent: 88,
      sealStatus: 'LOCKED_SECURE',
      speedKmh: 72,
      currentLocation: 'Adama Expressway Link',
      geofenceAlarm: false
    },
    {
      id: 'CNV-03',
      truckPlate: '3-C44102 ET',
      driver: 'Ahmed Hassen',
      destination: 'Modjo Dry Port',
      sealId: 'ECTS-ET-99301',
      batteryPercent: 41,
      sealStatus: 'LOCKED_SECURE',
      speedKmh: 0,
      currentLocation: 'Galafi Customs Inspection Bay',
      geofenceAlarm: false
    }
  ]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Electronic Cargo Tracking System (ECTS) & Smart E-Seal Monitor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time corridor telemetry, GPS geofence locking, and tamper alarms on Djibouti-Addis Highway
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900">
          3 / 3 E-Seals Armed & Transmitting
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {convoys.map(convoy => (
          <div
            key={convoy.id}
            className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 card-hover-lift space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {convoy.truckPlate}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                {convoy.sealStatus}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="font-medium">{convoy.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Smart Seal ID:</span>
                <code className="font-mono text-slate-900 dark:text-white font-bold">{convoy.sealId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Corridor Telematics:</span>
                <span className="font-mono text-emerald-600 font-semibold">{convoy.speedKmh} km/h</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{convoy.currentLocation}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                <span>Battery: <strong>{convoy.batteryPercent}%</strong></span>
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-mono text-[10px]">
                <Wifi className="w-3 h-3" />
                4G Uplink Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
