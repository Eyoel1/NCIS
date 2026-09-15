import L from 'react';
import Leaflet from 'leaflet';
import { DelayRisk, ShipmentStage } from '../../types';

export function createVehicleDivIcon(stage: ShipmentStage, delayRisk: DelayRisk = 'LOW') {
  let colorClass = 'bg-sky-500';
  let pingClass = 'bg-sky-400';
  let iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 17h4V5H2v12h3m9 0h2l3-3V9h-5v8z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>`;

  if (stage === 'SHIPPING') {
    colorClass = 'bg-sky-500';
    pingClass = 'bg-sky-400';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
        <path d="M12 1v4"/>
      </svg>`;
  } else if (stage === 'CUSTOMS') {
    colorClass = 'bg-amber-500';
    pingClass = 'bg-amber-400';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>`;
  } else if (stage === 'DELIVERY') {
    colorClass = 'bg-emerald-500';
    pingClass = 'bg-emerald-400';
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`;
  }

  // Delay risk override
  if (delayRisk === 'HIGH' || delayRisk === 'CRITICAL') {
    colorClass = 'bg-rose-500';
    pingClass = 'bg-rose-400';
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <span class="animate-ping" style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: currentColor; opacity: 0.4;" class="${pingClass}"></span>
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 9999px; border: 2px solid #0f172a; box-shadow: 0 4px 6px rgba(0,0,0,0.4);" class="${colorClass}">
        ${iconSvg}
      </div>
    </div>
  `;

  return Leaflet.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
