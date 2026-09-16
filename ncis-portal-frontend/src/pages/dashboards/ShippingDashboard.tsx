import React, { useState, useEffect } from 'react';
import { useShipments } from '../../context/ShipmentContext';
import { ElectronicBolModal } from '../../components/shipping/ElectronicBolModal';
import { TableToolbar } from '../../components/common/TableToolbar';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import { api } from '../../services/api';
import { Shipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Ship,
  Anchor,
  Compass,
  FileCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ShippingDashboard: React.FC = () => {
  const { shipments, endorseBol } = useShipments();
  const { setRole } = useAuth();
  const navigate = useNavigate();

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showEBolModal, setShowEBolModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBolModal, setShowBolModal] = useState(false);
  const [bolSuccess, setBolSuccess] = useState(false);
  const [nextStepShipment, setNextStepShipment] = useState<Shipment | null>(null);

  // Sea transit status form
  const [vesselName, setVesselName] = useState('MV Horn Pioneer');
  const [newLocation, setNewLocation] = useState('Gulf of Aden - Bab el Mandeb Approach');
  const [transitUpdated, setTransitUpdated] = useState(false);

  useEffect(() => {
    if (shipments.length > 0 && !selectedShipment) {
      setSelectedShipment(shipments[0]);
    }
  }, [shipments, selectedShipment]);

  const handleIssueBol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    const bolNumber = selectedShipment.billOfLadingNumber || `HML-BOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    await endorseBol(selectedShipment.id, bolNumber, vesselName);
    setBolSuccess(true);
    setNextStepShipment(selectedShipment);
    setTimeout(() => {
      setBolSuccess(false);
      setShowBolModal(false);
    }, 1200);
  };

  const handleUpdateTransit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransitUpdated(true);
    setTimeout(() => setTransitUpdated(false), 2000);
  };

  const filteredShipments = shipments.filter(shp => {
    const q = searchQuery.toLowerCase();
    return !q ||
      shp.trackingNumber?.toLowerCase().includes(q) ||
      shp.containerNumber?.toLowerCase().includes(q) ||
      shp.billOfLadingNumber?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.make?.toLowerCase().includes(q);
  });

  const handleExportCsv = () => {
    const headers = ['B/L Number', 'Container #', 'Vehicle', 'Loading Port', 'Discharge Port', 'Stage'];
    const rows = filteredShipments.map(s => [
      s.billOfLadingNumber || s.trackingNumber || '',
      s.containerNumber || '',
      `${s.vehicles?.[0]?.make || ''} ${s.vehicles?.[0]?.model || ''}`,
      s.originPort || 'Jebel Ali, UAE',
      s.destinationPort || 'Port of Djibouti',
      s.currentStage || ''
    ]);
    exportToCsv('Ocean_Consignment_Manifests', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Ship className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Shipping Line Fleet Operations Command</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Horn Maritime Line • Ocean freight, electronic manifests, B/L issuance, and vessel telematics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Vessels En Route</span>
          <div className="text-2xl font-black text-white font-mono mt-1">3 Ships</div>
          <p className="text-[11px] text-sky-400 mt-0.5">Gulf of Aden / Red Sea</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Manifested Vehicles</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">450 Units</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Under Active B/L Manifest</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Pending Arrival Notices</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">2 Pending</div>
          <p className="text-[11px] text-slate-400 mt-0.5">ETA &lt; 24h to Djibouti</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">On-Time Voyage Rate</span>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">94.2%</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Optimal Sea Transit</p>
        </div>
      </div>

      {/* Fleet Schedule & Live Status Updater */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Fleet Schedule */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-400" />
              Active Maritime Voyage Schedule
            </span>
            <span className="text-[10px] font-mono text-slate-400">Voyages 2026-Q3</span>
          </div>

          <div className="space-y-3">
            {[
              {
                vessel: 'MV Horn Pioneer (IMO 9482014)',
                voyage: 'HP-2026-09A',
                route: 'Jebel Ali (AEJEA) → Port of Djibouti (DJJIB)',
                status: 'AT_SEA',
                eta: '18h (Sep 16, 06:00)',
                capacity: '220 Vehicles (98% Laden)',
              },
              {
                vessel: 'MV Red Sea Trader (IMO 9283741)',
                voyage: 'RST-2026-11B',
                route: 'Yokohama (JPYOK) → Port of Djibouti (DJJIB)',
                status: 'AT_PORT',
                eta: 'Berthing at Doraleh RoRo',
                capacity: '140 Vehicles (100% Laden)',
              },
              {
                vessel: 'MV Gulf Express (IMO 9192842)',
                voyage: 'GE-2026-04C',
                route: 'Shanghai (CNSHA) → Port of Berbera (SOBBO)',
                status: 'AT_SEA',
                eta: '36h (Sep 17, 14:00)',
                capacity: '90 Vehicles (EV Priority)',
              },
            ].map((v) => (
              <div key={v.voyage} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{v.vessel}</span>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-slate-300">{v.route}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>ETA: <strong className="text-sky-300">{v.eta}</strong></span>
                  <span>{v.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sea Transit Updater Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Anchor className="h-4 w-4 text-emerald-400" />
              Transmit AIS Telematics Update
            </span>
          </div>

          <form onSubmit={handleUpdateTransit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Vessel</label>
              <select
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="MV Horn Pioneer">MV Horn Pioneer (Voyage HP-2026-09A)</option>
                <option value="MV Red Sea Trader">MV Red Sea Trader (Voyage RST-2026-11B)</option>
                <option value="MV Gulf Express">MV Gulf Express (Voyage GE-2026-04C)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Current AIS Position / Waypoint</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Notice of Arrival (NOA) Broadcast</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">
                <option>Transmit Electronic NOA to Djibouti Port Authority (Doraleh TOS)</option>
                <option>Transmit Electronic NOA to DP World Berbera</option>
                <option>Customs Advance Cargo Declaration Sync</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {transitUpdated ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span>{transitUpdated ? 'Telematics Broadcasted!' : 'Broadcast Position & ETA'}</span>
            </button>
          </form>
        </div>
      </div>

      {nextStepShipment && (
        <div className="p-4 rounded-2xl border border-sky-500/40 bg-sky-950/40 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-sky-300 block">
                Electronic Bill of Lading (e-B/L) Endorsed for {nextStepShipment.trackingNumber}!
              </span>
              <p className="text-[11px] text-slate-300">
                Title legally endorsed. The consignment has automatically advanced to <strong>PORT_OPERATIONS</strong> stage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setRole('PORT_OPERATOR');
              navigate('/dashboard/port-terminal-operators');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition shrink-0 cursor-pointer"
          >
            <span>Proceed to Step 4: Port Operator (Doraleh Gate-Out)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cargo Manifest & B/L Issuance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-sky-400" />
            Consignment Manifest & Bill of Lading (B/L) Control
          </span>
          <span className="text-xs text-slate-400">Cargo Stowed in Holds 1-4</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">B/L Number</th>
                <th className="pb-2.5">Container #</th>
                <th className="pb-2.5">Consigned Vehicle</th>
                <th className="pb-2.5">Loading Port</th>
                <th className="pb-2.5">Stage</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-sky-400 font-bold">{shp.billOfLadingNumber || 'PENDING-BL'}</td>
                  <td className="py-3 text-slate-300">{shp.containerNumber || 'MSKU-PENDING'}</td>
                  <td className="py-3 font-sans text-white">{shp.title}</td>
                  <td className="py-3 font-sans text-slate-400">{shp.originPort}</td>
                  <td className="py-3">
                    <StatusBadge status={shp.currentStage} />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShipment(shp);
                        setShowBolModal(true);
                      }}
                      className="px-2.5 py-1 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800 text-[11px] font-semibold transition-colors"
                    >
                      Issue / Endorse B/L
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill of Lading Issuance Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showBolModal}
          onClose={() => setShowBolModal(false)}
          title={`Endorse Bill of Lading: ${selectedShipment.billOfLadingNumber || 'NEW B/L'}`}
          subtitle="Horn Maritime Line • Ocean Bill of Lading Authorization"
        >
          <form onSubmit={handleIssueBol} className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <p className="text-slate-400 font-sans">Vessel: <strong className="text-white">{selectedShipment.vesselName || 'MV Horn Pioneer'}</strong></p>
              <p className="text-slate-400 font-sans">Consignee: <strong className="text-white">{selectedShipment.importer?.organization || 'Ethio Auto Imports PLC'}</strong></p>
              <p className="text-slate-400 font-sans">Discharge Port: <strong className="text-white">{selectedShipment.transitPort || 'Port of Djibouti'}</strong></p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowBolModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5"
              >
                {bolSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{bolSuccess ? 'B/L Transmitted!' : 'Transmit Electronic B/L'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Electronic Ocean Bill of Lading Modal */}
      {selectedShipment && (
        <ElectronicBolModal
          isOpen={showEBolModal}
          onClose={() => setShowEBolModal(false)}
          shipment={{
            bolNumber: selectedShipment.billOfLadingNumber || 'HML-BOL-2026-84920',
            vesselName: selectedShipment.vesselName || 'MV Horn Pioneer',
            voyageNumber: selectedShipment.voyageNumber || 'HP-2026-09A',
            originPort: selectedShipment.originPort || 'Port of Jebel Ali, UAE',
            destinationPort: selectedShipment.destinationPort || 'Port of Djibouti (Doraleh)',
            shipper: 'Toyota Tsusho Corporation (Dubai Logistics Hub)',
            consignee: selectedShipment.importer?.fullName || 'Ethio Auto Imports PLC (To Order)',
            containerNumber: selectedShipment.containerNumber || 'MSCU7849201',
            sealNumber: 'ET-SEAL-99824',
            cargoDescription: `1x40HQ Container S.T.C. ${selectedShipment.vehicles?.[0]?.make || 'Toyota'} ${selectedShipment.vehicles?.[0]?.model || 'Prado'} (VIN: ${selectedShipment.vehicles?.[0]?.vin || 'AHT02981048201'})`,
            weightKg: 2850,
            issueDate: '2026-02-22'
          }}
        />
      )}
    </div>
  );
};
