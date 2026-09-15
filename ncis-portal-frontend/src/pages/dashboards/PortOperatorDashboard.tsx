import React, { useState, useEffect } from 'react';
import { YardSlotMapWidget } from '../../components/port/YardSlotMapWidget';
import { PortCongestionBarChart } from '../../components/charts/DashboardCharts';
import { TableToolbar } from '../../components/common/TableToolbar';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import { api } from '../../services/api';
import { Shipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Anchor,
  Layers,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const PortOperatorDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [portFilter, setPortFilter] = useState('ALL');
  const [showGateOutModal, setShowGateOutModal] = useState(false);
  const [gateOutSuccess, setGateOutSuccess] = useState(false);

  // Yard staging form
  const [yardSlot, setYardSlot] = useState('Sector C-4 (RoRo High Density)');
  const [dischargeStatus, setDischargeStatus] = useState('DISCHARGED_TO_YARD');
  const [stagingUpdated, setStagingUpdated] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await api.getShipments();
      setShipments(data);
    }
    loadData();
  }, []);

  const handleUpdateStaging = (e: React.FormEvent) => {
    e.preventDefault();
    setStagingUpdated(true);
    setTimeout(() => setStagingUpdated(false), 2000);
  };

  const handleGateOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await api.updateStage(selectedShipment.id, 'CUSTOMS', 'Container gated out from Port Terminal; en route to Modjo Dry Port.');
      setGateOutSuccess(true);
      setTimeout(() => {
        setGateOutSuccess(false);
        setShowGateOutModal(false);
      }, 1500);
    } catch {
      // Ignore
    }
  };

  const filteredShipments = shipments.filter(shp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      shp.trackingNumber?.toLowerCase().includes(q) ||
      shp.containerNumber?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.make?.toLowerCase().includes(q);

    const matchesPort = portFilter === 'ALL' || shp.originPort === portFilter || shp.destinationPort === portFilter;
    return matchesSearch && matchesPort;
  });

  const handleExportCsv = () => {
    const headers = ['Tracking #', 'Container #', 'Consigned Vehicle', 'Port Terminal', 'Stage', 'Status'];
    const rows = filteredShipments.map(s => [
      s.trackingNumber || '',
      s.containerNumber || '',
      `${s.vehicles?.[0]?.make || ''} ${s.vehicles?.[0]?.model || ''}`,
      s.originPort || 'Port of Djibouti',
      s.currentStage || '',
      s.status || ''
    ]);
    exportToCsv('Port_Terminal_Inventory', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Anchor className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Port Terminal Operations (Djibouti & Berbera)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Doraleh Container Terminal (DCT) & Port of Berbera • Yard staging, discharge tally, and gate-out TIR clearance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Berth Utilization</span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">91% (High)</div>
          <p className="text-[11px] text-slate-400 mt-0.5">7 Vessels at Anchorage</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Average Dwell Time</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">4.2 Days</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Free Time Limit: 5 Days</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Vehicles in Yard</span>
          <div className="text-2xl font-black text-white font-mono mt-1">1,420 Units</div>
          <p className="text-[11px] text-sky-400 mt-0.5">Sectors A, B, C & RoRo</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Daily Gate-Out Tally</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">185 Trucks</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Dispatched to Galafi Corridor</p>
        </div>
      </div>

      {/* Terminal Yard Staging & Vessel Discharge Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Yard Assignment */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              Terminal Yard Staging Slots
            </span>
            <span className="text-[10px] font-mono text-emerald-400">TOS SYNCED</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Sector A (Container Stacks)</span>
              <strong className="text-white font-mono">640 TEUs</strong>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-sky-500 h-full" style={{ width: '74%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">74% Utilization</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Sector C (RoRo Vehicle Depot)</span>
              <strong className="text-rose-400 font-mono">820 Units</strong>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: '92%' }} />
              </div>
              <span className="text-[10px] text-rose-400 mt-1 block">92% Congested (Demurrage Risk)</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Berbera Terminal Staging</span>
              <strong className="text-emerald-400 font-mono">340 Units</strong>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '41%' }} />
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">41% Fluid / No Delay</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Inspection Quarantine Bay</span>
              <strong className="text-amber-400 font-mono">18 Flagged</strong>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: '35%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Customs Physical Seals Pending</span>
            </div>
          </div>
        </div>

        {/* Discharge Logger Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              Log Container Discharging
            </span>
          </div>

          <form onSubmit={handleUpdateStaging} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Berth & Vessel</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">
                <option>Berth 3: MV Horn Pioneer (Discharging 220 units)</option>
                <option>Berth 1: MV Red Sea Trader (Discharging 140 units)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Assign Yard Slot</label>
              <input
                type="text"
                value={yardSlot}
                onChange={(e) => setYardSlot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Container Condition & Customs Seal</label>
              <select
                value={dischargeStatus}
                onChange={(e) => setDischargeStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="DISCHARGED_TO_YARD">Seal Verified (Intact) - Move to Staging</option>
                <option value="SEAL_BROKEN_HOLD">Seal Discrepancy - Move to Customs Hold Bay</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {stagingUpdated ? <CheckCircle2 className="h-4 w-4" /> : null}
              <span>{stagingUpdated ? 'Yard Staging Logged!' : 'Record Berth Discharge'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Yard Inventory & Gate-Out Clearance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-400" />
            Yard Inventory & Truck Interchange Receipt (TIR) Gate-Out Queue
          </span>
          <span className="text-xs text-slate-400">Containers Ready for Inland Convoy</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Tracking Number</th>
                <th className="pb-2.5">Vehicle Consigned</th>
                <th className="pb-2.5">Container #</th>
                <th className="pb-2.5">Port Terminal</th>
                <th className="pb-2.5">Current Stage</th>
                <th className="pb-2.5 text-right">Gate-Out Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-sky-400 font-bold">{shp.trackingNumber}</td>
                  <td className="py-3 font-sans text-white">{shp.title}</td>
                  <td className="py-3 text-slate-300">{shp.containerNumber || 'MSKU-948201-4'}</td>
                  <td className="py-3 font-sans text-slate-400">{shp.transitPort || 'Port of Djibouti'}</td>
                  <td className="py-3">
                    <StatusBadge status={shp.currentStage} />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShipment(shp);
                        setShowGateOutModal(true);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-semibold transition-colors"
                    >
                      Clear Gate-Out (TIR)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gate-Out Clearance Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showGateOutModal}
          onClose={() => setShowGateOutModal(false)}
          title={`Issue Gate-Out Clearance: ${selectedShipment.containerNumber || 'CONTAINER'}`}
          subtitle="Record Truck Interchange Receipt (TIR) & Bonded Seal Check"
        >
          <form onSubmit={handleGateOut} className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <p className="text-slate-400 font-sans">Shipment: <strong className="text-white">{selectedShipment.title}</strong></p>
              <p className="text-slate-400 font-sans">Carrier: <strong className="text-white">Trans-Ethiopia Logistics (Prime Mover ET-3-A9281)</strong></p>
              <p className="text-slate-400 font-sans">Exit Gate: <strong className="text-white">Doraleh Terminal Gate 4 (Corridor Outbound)</strong></p>
              <p className="text-slate-400 font-sans">Customs Bond Seal: <strong className="text-emerald-400">#9F82A0 (Intact & Scanned)</strong></p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowGateOutModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
              >
                {gateOutSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{gateOutSuccess ? 'Gate-Out Authorized!' : 'Authorize Gate-Out & Convoy'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
