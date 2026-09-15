import React, { useState, useEffect } from 'react';
import { EctsTelematicsWidget } from '../../components/transport/EctsTelematicsWidget';
import { CorridorTransitChart } from '../../components/charts/DashboardCharts';
import { TableToolbar } from '../../components/common/TableToolbar';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import { api } from '../../services/api';
import { Shipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Truck,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Send,
} from 'lucide-react';

export const TransportDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Dispatch form
  const [primeMoverPlate, setPrimeMoverPlate] = useState('ET-3-A9281');
  const [driverName, setDriverName] = useState('Dawit Haile');
  const [driverPhone, setDriverPhone] = useState('+251 91 567 8901');
  const [gpsTrackerId, setGpsTrackerId] = useState('GPS-ETH-9821');

  // Waypoint logger
  const [currentWaypoint, setCurrentWaypoint] = useState('Awash Highway Transit Checkpoint');
  const [waypointLogged, setWaypointLogged] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await api.getShipments();
      setShipments(data);
      if (data.length > 0) setSelectedShipment(data[0]);
    }
    loadData();
  }, []);

  const handleDispatchTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await api.updateStage(
        selectedShipment.id,
        'POST_CUSTOMS',
        `Dispatched to inland truck ${primeMoverPlate}, driver ${driverName} (GPS: ${gpsTrackerId}).`
      );
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
        setShowDispatchModal(false);
      }, 1500);
    } catch {
      // Ignore
    }
  };

  const handleLogWaypoint = (e: React.FormEvent) => {
    e.preventDefault();
    setWaypointLogged(true);
    setTimeout(() => setWaypointLogged(false), 2000);
  };

  const filteredShipments = shipments.filter(shp => {
    const q = searchQuery.toLowerCase();
    return !q ||
      shp.trackingNumber?.toLowerCase().includes(q) ||
      shp.containerNumber?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.make?.toLowerCase().includes(q);
  });

  const handleExportCsv = () => {
    const headers = ['Tracking #', 'Container #', 'Vehicle', 'Terminal Destination', 'Corridor Stage'];
    const rows = filteredShipments.map(s => [
      s.trackingNumber || '',
      s.containerNumber || '',
      `${s.vehicles?.[0]?.make || ''} ${s.vehicles?.[0]?.model || ''}`,
      s.destinationPort || 'Modjo Dry Port',
      s.currentStage || ''
    ]);
    exportToCsv('Corridor_Freight_Dispatches', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Truck className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Freight Forwarding & Inland Corridor Dispatch</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Trans-Ethiopia Logistics PLC • Multi-modal road convoys, Galafi border transit seals, and GPS waypoint tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Active Trucks on Corridor</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">14 Trucks</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Djibouti → Modjo Highway</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Awaiting Port Dispatch</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">8 Containers</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Doraleh Terminal Gate 4</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Average Transit Time</span>
          <div className="text-2xl font-black text-sky-400 font-mono mt-1">32.4 Hours</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Corridor Route 1 (910 km)</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Galafi Border Crossing Delay</span>
          <div className="text-2xl font-black text-white font-mono mt-1">1.2 Hours</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Automated Seal Check Active</p>
        </div>
      </div>

      {/* Corridor Route Dispatcher & Live Waypoint Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Transit Convoys */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Navigation className="h-4 w-4 text-sky-400" />
              Active Corridor Transit Fleets
            </span>
            <span className="text-[10px] font-mono text-slate-400">Route: Galafi → Modjo</span>
          </div>

          <div className="space-y-3">
            {[
              {
                truck: 'Scania R500 (Plate: ET-3-A9281)',
                driver: 'Dawit Haile (+251 91 567 8901)',
                cargo: 'Container MSKU-948201-4 (Toyota Prado)',
                location: 'Awash Transit Checkpoint (Speed: 58 km/h)',
                status: 'ON_SCHEDULE',
                eta: '14 Hours to Kality',
              },
              {
                truck: 'Volvo FH16 (Plate: ET-3-B4920)',
                driver: 'Kassahun Bekele (+251 91 884 1029)',
                cargo: 'Container TGHU-849201-9 (Hyundai Tucson)',
                location: 'Galafi Border Customs Post (Seal Check)',
                status: 'IN_INSPECTION',
                eta: '22 Hours to Modjo',
              },
              {
                truck: 'Isuzu Giga (Plate: ET-3-C1948)',
                driver: 'Tewodros Girma (+251 91 332 9940)',
                cargo: 'Container CMAU-482019-3 (Isuzu FTR)',
                location: 'Dikhil Highway (Departed Djibouti)',
                status: 'DEPARTED',
                eta: '28 Hours to Modjo',
              },
            ].map((c) => (
              <div key={c.truck} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{c.truck}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {c.status}
                  </span>
                </div>
                <p className="text-slate-300">Driver: {c.driver}</p>
                <p className="text-slate-400 font-mono text-[11px]">{c.cargo}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-sky-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {c.location}
                  </span>
                  <span className="text-slate-400 font-mono">{c.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GPS Waypoint Logger Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Log GPS Waypoint Checkpoint
            </span>
          </div>

          <form onSubmit={handleLogWaypoint} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Truck / Driver Assigned</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono">
                <option>Scania R500 (ET-3-A9281) - Dawit Haile</option>
                <option>Volvo FH16 (ET-3-B4920) - Kassahun Bekele</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Corridor Checkpoint</label>
              <select
                value={currentWaypoint}
                onChange={(e) => setCurrentWaypoint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option>Galafi Border Customs Station (Entry Stamp)</option>
                <option>Awash Transit Checkpoint (Weight Scale)</option>
                <option>Adama Toll Plaza</option>
                <option>Modjo Multimodal Dry Port Gate-In</option>
                <option>Kality Inland Container Depot Arrival</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Customs Bond Electronic Seal</label>
              <input
                type="text"
                defaultValue="E-SEAL #9F82A0 (INTEGRITY CONFIRMED)"
                disabled
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {waypointLogged ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              <span>{waypointLogged ? 'Waypoint Transmitted!' : 'Log Telematics Checkpoint'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Dispatch Fleet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-sky-400" />
            Consignments Awaiting Prime Mover Dispatch
          </span>
          <span className="text-xs text-slate-400">Multi-Modal Road Freight</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Tracking Number</th>
                <th className="pb-2.5">Vehicle</th>
                <th className="pb-2.5">Container #</th>
                <th className="pb-2.5">Destination Terminal</th>
                <th className="pb-2.5">Stage</th>
                <th className="pb-2.5 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-sky-400 font-bold">{shp.trackingNumber}</td>
                  <td className="py-3 font-sans text-white">{shp.title}</td>
                  <td className="py-3 text-slate-300">{shp.containerNumber || 'MSKU-948201-4'}</td>
                  <td className="py-3 font-sans text-slate-400">{shp.destinationPort}</td>
                  <td className="py-3">
                    <StatusBadge status={shp.currentStage} />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShipment(shp);
                        setShowDispatchModal(true);
                      }}
                      className="px-2.5 py-1 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800 text-[11px] font-semibold transition-colors"
                    >
                      Assign Prime Mover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Truck Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
          title={`Dispatch Inland Prime Mover: ${selectedShipment.trackingNumber}`}
          subtitle="Assign Truck, Driver & Electronic Bond Seal for Highway Convoy"
        >
          <form onSubmit={handleDispatchTruck} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 font-medium mb-1 font-sans">Prime Mover License Plate</label>
              <input
                type="text"
                value={primeMoverPlate}
                onChange={(e) => setPrimeMoverPlate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 font-sans">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 font-sans">GPS Tracker Telematics Unit</label>
              <input
                type="text"
                value={gpsTrackerId}
                onChange={(e) => setGpsTrackerId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5"
              >
                {dispatchSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{dispatchSuccess ? 'Convoy Dispatched!' : 'Authorize Corridor Transit'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
