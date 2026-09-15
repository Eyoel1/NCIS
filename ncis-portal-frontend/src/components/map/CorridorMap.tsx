import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Shipment, PortCongestionInfo } from '../../types';
import { createVehicleDivIcon } from './VehicleMarker';
import { PortCongestionHeatmap } from './PortCongestionHeatmap';
import { MOCK_PORTS } from '../../services/mockData';
import { Layers, Eye, EyeOff, Navigation, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CorridorMapProps {
  shipments?: Shipment[];
  focusedShipmentId?: string;
  height?: string;
  showControls?: boolean;
}

// Geographic Waypoint Polylines
const MARITIME_ROUTE: LatLngExpression[] = [
  [25.01, 55.06],  // Jebel Ali
  [26.56, 56.41],  // Strait of Hormuz
  [24.50, 58.50],  // Gulf of Oman
  [18.20, 57.00],  // Arabian Sea
  [14.50, 53.00],
  [12.35, 47.50],  // Gulf of Aden
  [12.60, 43.40],  // Bab-el-Mandeb
  [11.602, 43.141] // Port of Djibouti
];

const BERBERA_FEEDER: LatLngExpression[] = [
  [12.35, 47.50],
  [11.20, 46.20],
  [10.438, 45.014] // Port of Berbera
];

const INLAND_CORRIDOR: LatLngExpression[] = [
  [11.602, 43.141], // Djibouti
  [11.550, 42.850],
  [11.717, 41.838], // Galafi Border Post
  [11.794, 41.008],
  [10.500, 40.800],
  [8.983, 40.167],  // Awash Transit Hub
  [8.540, 39.270],  // Adama
  [8.590, 39.120],  // Modjo Multimodal Dry Port
  [8.910, 38.760],  // Kality Dry Port
  [9.020, 38.740],  // Addis Ababa Vehicle Center
];

const RAIL_CORRIDOR: LatLngExpression[] = [
  [11.602, 43.141], // Djibouti
  [11.350, 42.900],
  [11.033, 42.617], // Dewele Border
  [9.593, 41.866],  // Dire Dawa
  [9.350, 41.200],
  [8.983, 40.167],  // Awash
  [8.590, 39.120],  // Modjo
  [8.910, 38.760],  // Addis Ababa Indode / Kality
];

export const CorridorMap: React.FC<CorridorMapProps> = ({
  shipments = [],
  focusedShipmentId,
  height = '500px',
  showControls = true,
}) => {
  const [showMaritime, setShowMaritime] = useState(true);
  const [showInland, setShowInland] = useState(true);
  const [showCongestion, setShowCongestion] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  // Determine initial center
  const focused = shipments.find((s) => s.id === focusedShipmentId || s.trackingNumber === focusedShipmentId);
  const defaultCenter: LatLngExpression = focused?.currentLatitude && focused?.currentLongitude
    ? [focused.currentLatitude, focused.currentLongitude]
    : [11.0, 42.5];
  const defaultZoom = focused ? 8 : 6;

  return (
    <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl" style={{ height }}>
      {/* Map Filter Controls Overlay */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>GIS Layers</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showMaritime}
              onChange={(e) => setShowMaritime(e.target.checked)}
              className="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-800"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Maritime Lanes
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showInland}
              onChange={(e) => setShowInland(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-800"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Inland Highway Corridor
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showCongestion}
              onChange={(e) => setShowCongestion(e.target.checked)}
              className="rounded border-slate-700 text-rose-500 focus:ring-0 bg-slate-800"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Port Congestion Heatmaps
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showVehicles}
              onChange={(e) => setShowVehicles(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-800"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live Vehicles ({shipments.length})
            </span>
          </label>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Maritime Shipping Lanes */}
        {showMaritime && (
          <>
            <Polyline
              positions={MARITIME_ROUTE}
              pathOptions={{
                color: '#38bdf8',
                weight: 3,
                dashArray: '8, 8',
                opacity: 0.85,
              }}
            />
            <Polyline
              positions={BERBERA_FEEDER}
              pathOptions={{
                color: '#14b8a6',
                weight: 2.5,
                dashArray: '6, 6',
                opacity: 0.85,
              }}
            />
          </>
        )}

        {/* 2. Inland Transit Corridor & Rail */}
        {showInland && (
          <>
            {/* Dark casing for highway */}
            <Polyline
              positions={INLAND_CORRIDOR}
              pathOptions={{
                color: '#0f172a',
                weight: 6,
                opacity: 0.9,
              }}
            />
            {/* Primary Bonded Highway */}
            <Polyline
              positions={INLAND_CORRIDOR}
              pathOptions={{
                color: '#f59e0b',
                weight: 4,
                opacity: 0.95,
              }}
            />
            {/* Railway */}
            <Polyline
              positions={RAIL_CORRIDOR}
              pathOptions={{
                color: '#818cf8',
                weight: 2.5,
                dashArray: '4, 8',
                opacity: 0.75,
              }}
            />
          </>
        )}

        {/* 3. Port Congestion Heatmaps */}
        {showCongestion && <PortCongestionHeatmap ports={MOCK_PORTS} />}

        {/* 4. Active Vehicle Tracking Markers */}
        {showVehicles &&
          shipments.map((shp) => {
            if (!shp.currentLatitude || !shp.currentLongitude) return null;
            const icon = createVehicleDivIcon(shp.currentStage, shp.delayRiskRating);
            const veh = shp.vehicles?.[0];

            return (
              <Marker
                key={shp.id}
                position={[shp.currentLatitude, shp.currentLongitude]}
                icon={icon}
              >
                <Popup>
                  <div className="min-w-[240px] text-xs">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
                      <span className="font-mono font-bold text-sky-400">
                        {shp.trackingNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          shp.delayRiskRating === 'HIGH' || shp.delayRiskRating === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {shp.delayRiskRating} Risk
                      </span>
                    </div>

                    <div className="space-y-1 mb-3 text-slate-300">
                      <p className="font-bold text-white text-sm">
                        {veh ? `${veh.make} ${veh.model} (${veh.year})` : shp.title}
                      </p>
                      {veh && (
                        <p className="font-mono text-[11px] text-slate-400">
                          VIN: {veh.vin}
                        </p>
                      )}
                      <p className="text-slate-300 flex items-center gap-1 mt-1">
                        <Navigation className="h-3 w-3 text-sky-400 shrink-0" />
                        <span className="truncate">{shp.currentLocationName || 'In Transit'}</span>
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Stage: <strong className="text-slate-200">{shp.currentStage.replace(/_/g, ' ')}</strong>
                      </p>
                    </div>

                    <Link
                      to={`/track/${shp.trackingNumber}`}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-center transition-colors"
                    >
                      <span>Full Tracking Dossier</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
