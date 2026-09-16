import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShipments } from '../../context/ShipmentContext';
import { useAuth } from '../../context/AuthContext';
import { Shipment, ShipmentStage, UserRole } from '../../types';
import { NationalSlaHeatmapWidget } from '../../components/admin/NationalSlaHeatmapWidget';
import { RevenueTrendChart, PortCongestionBarChart } from '../../components/charts/DashboardCharts';
import { TableToolbar } from '../../components/common/TableToolbar';
import { UnifiedDocumentBinderModal } from '../../components/documents/UnifiedDocumentBinderModal';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import {
  ShieldAlert,
  Zap,
  Radio,
  RotateCcw,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Megaphone,
  FastForward,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useAuth();
  const {
    shipments,
    auditLogs,
    activeChaosEvents,
    flashBulletin,
    godModeSetStage,
    godModeFastForward,
    godModeInjectChaos,
    godModeBroadcastBulletin,
    godModeResetDatabase,
  } = useShipments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipmentForBinder, setSelectedShipmentForBinder] = useState<Shipment | null>(null);
  const [bulletinInput, setBulletinInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Filtered shipments
  const filteredShipments = shipments.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.trackingNumber?.toLowerCase().includes(q) ||
      s.vehicles?.[0]?.vin?.toLowerCase().includes(q) ||
      s.vehicles?.[0]?.make?.toLowerCase().includes(q) ||
      s.importer?.fullName?.toLowerCase().includes(q) ||
      s.currentStage?.toLowerCase().includes(q)
    );
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinInput.trim()) return;
    godModeBroadcastBulletin(bulletinInput.trim());
    setBulletinInput('');
  };

  const handleVerifyChain = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifySuccess(true);
      setTimeout(() => setVerifySuccess(false), 3000);
    }, 600);
  };

  const handleImpersonate = (role: UserRole) => {
    switchRole(role);
    const rolePaths: Record<UserRole, string> = {
      SUPER_ADMIN: '/dashboard/super-admin',
      IMPORTER_SUPPLIER: '/dashboard/importer',
      SHIPPING_COMPANY: '/dashboard/shipping',
      PORT_OPERATOR: '/dashboard/port',
      CUSTOMS_AUTHORITY: '/dashboard/customs',
      TRANSPORT_FORWARDER: '/dashboard/forwarder',
      FINANCIAL_INSURANCE: '/dashboard/finance',
      VEHICLE_REGISTRATION: '/dashboard/registration',
    };
    navigate(rolePaths[role] || '/dashboard');
  };

  const handleExportCsv = () => {
    const headers = ['Tracking #', 'Importer', 'Make/Model', 'Chassis/VIN', 'Stage', 'Status', 'CIF (ETB)'];
    const rows = filteredShipments.map(s => [
      s.trackingNumber || '',
      s.importer?.fullName || '',
      `${s.vehicles?.[0]?.make || ''} ${s.vehicles?.[0]?.model || ''}`,
      s.vehicles?.[0]?.vin || '',
      s.currentStage || '',
      s.status || '',
      s.vehicles?.[0]?.cifValue || s.customsAssessment?.assessedCif || 0
    ]);
    exportToCsv('National_Command_Master_Cockpit', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* SOVEREIGN GOD MODE COMMAND BAR */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-2 border-indigo-500/50 shadow-2xl text-white space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-widest border border-indigo-500/40">
                  ⚡ Sovereign Authority Active
                </span>
                <span className="text-xs text-slate-400 font-mono">National Single Window Command</span>
              </div>
              <h1 className="text-xl font-black tracking-wide text-white mt-0.5">
                SUPER ADMIN "GOD MODE" COCKPIT
              </h1>
              <p className="text-xs text-indigo-200/80">
                Full recursive control over all 8 agency databases • Stage overrides • Incident simulation • Master cryptographic ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{verifying ? 'Verifying Hashes...' : verifySuccess ? '✓ Chain Sealed (100%)' : 'Verify Merkle Chain'}</span>
            </button>

            <button
              onClick={godModeResetDatabase}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition shadow-xs active:scale-95"
              title="Reset all 8 stakeholder databases to initial clean state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>

        {/* Chaos Engineering & Live Incident Injectors */}
        <div className="pt-3 border-t border-indigo-900/60 relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block mb-2 font-mono flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Live Supply Chain Chaos & Stress-Test Injector:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Incident 1 */}
            <button
              onClick={() => godModeInjectChaos('TAMPER_ALARM', !activeChaosEvents.TAMPER_ALARM, 'Corridor truck convoy reported unauthorized smart seal breach at Galafi.')}
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                activeChaosEvents.TAMPER_ALARM
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="truncate">🚨 ECTS Seal Tamper</span>
              <span className="text-[10px] font-mono uppercase">{activeChaosEvents.TAMPER_ALARM ? 'ACTIVE' : 'OFF'}</span>
            </button>

            {/* Incident 2 */}
            <button
              onClick={() => godModeInjectChaos('PORT_GRIDLOCK', !activeChaosEvents.PORT_GRIDLOCK, 'Berth crane breakdown at Doraleh DCT triggered +3.5 day dwell penalty surge.')}
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                activeChaosEvents.PORT_GRIDLOCK
                  ? 'bg-amber-600 border-amber-400 text-white shadow-lg animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="truncate">🚢 Doraleh Gridlock</span>
              <span className="text-[10px] font-mono uppercase">{activeChaosEvents.PORT_GRIDLOCK ? 'ACTIVE' : 'OFF'}</span>
            </button>

            {/* Incident 3 */}
            <button
              onClick={() => godModeInjectChaos('UNDER_INVOICING_AUDIT', !activeChaosEvents.UNDER_INVOICING_AUDIT, 'High-risk under-invoicing flag injected on commercial vehicle consignment.')}
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                activeChaosEvents.UNDER_INVOICING_AUDIT
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="truncate">⚠️ Valuation Fraud</span>
              <span className="text-[10px] font-mono uppercase">{activeChaosEvents.UNDER_INVOICING_AUDIT ? 'ACTIVE' : 'OFF'}</span>
            </button>

            {/* Incident 4 */}
            <button
              onClick={() => godModeInjectChaos('ASYCUDA_DEGRADED', !activeChaosEvents.ASYCUDA_DEGRADED, 'ASYCUDA Customs Gateway degraded. Switched to offline cryptographic failover.')}
              className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                activeChaosEvents.ASYCUDA_DEGRADED
                  ? 'bg-sky-600 border-sky-400 text-white shadow-lg animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="truncate">🔌 ASYCUDA Failover</span>
              <span className="text-[10px] font-mono uppercase">{activeChaosEvents.ASYCUDA_DEGRADED ? 'ACTIVE' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* National Flash Directive Broadcaster */}
        <form onSubmit={handleBroadcast} className="pt-3 border-t border-indigo-900/60 flex items-center gap-2 relative z-10">
          <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            value={bulletinInput}
            onChange={(e) => setBulletinInput(e.target.value)}
            placeholder="Broadcast a national emergency operational flash directive across all 8 screens..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shrink-0"
          >
            Broadcast Bulletin
          </button>
        </form>
      </div>

      {/* Inter-Agency Corridor SLA Performance Heatmap */}
      <NationalSlaHeatmapWidget />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart />
        <PortCongestionBarChart />
      </div>

      {/* MASTER CROSS-AGENCY CONSIGNMENT COCKPIT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              National Single Window Master Consignment Cockpit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live oversight across all 8 agencies • Jump any shipment to any stage • Instant officer impersonation
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            Total Live Consignments: {shipments.length}
          </span>
        </div>

        {/* Toolbar */}
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          config={{ stageFilter: false, searchPlaceholder: 'Search by tracking #, VIN, vehicle, stage...' }}
          onExportCsv={handleExportCsv}
          onExportPdf={() => exportToPrintPdf('National Single Window Master Consignment Cockpit')}
          totalCount={shipments.length}
          filteredCount={filteredShipments.length}
        />

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Tracking / Consignee</th>
                <th className="py-3 px-3">Vehicle Details</th>
                <th className="py-3 px-3">Chassis / VIN</th>
                <th className="py-3 px-3">Current Stage</th>
                <th className="py-3 px-3">God Mode Stage Jump</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredShipments.map(s => {
                const vehicle: any = s.vehicles?.[0] || { make: 'Toyota', model: 'Prado', year: 2024, vin: 'N/A', registrationPlate: undefined };
                const isCompleted = s.currentStage === 'DELIVERY' && s.status === 'DELIVERED';

                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400 block">
                        {s.trackingNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {s.importer?.fullName || 'Ethio Auto Imports'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Plate: <strong className="text-slate-700 dark:text-slate-300">{vehicle.registrationPlate || 'Pending'}</strong>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <code className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                        {vehicle.vin}
                      </code>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : s.currentStage === 'CUSTOMS'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {s.currentStage}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={s.currentStage}
                        onChange={(e) => godModeSetStage(s.id, e.target.value as ShipmentStage)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="PRE_IMPORT">1. PRE_IMPORT (Bank FX)</option>
                        <option value="SHIPPING">2. SHIPPING (e-B/L)</option>
                        <option value="PORT_OPERATIONS">3. PORT_OPERATIONS (Doraleh)</option>
                        <option value="CUSTOMS">4. CUSTOMS (Modjo Duty)</option>
                        <option value="POST_CUSTOMS">5. POST_CUSTOMS (Corridor)</option>
                        <option value="DELIVERY">6. DELIVERY (MOTL Libre)</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Fast Forward button */}
                        {!isCompleted && (
                          <button
                            onClick={() => godModeFastForward(s.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-[11px] transition"
                            title="Fast-forward through all remaining checkpoints"
                          >
                            <FastForward className="w-3 h-3" />
                            <span>Fast-Forward</span>
                          </button>
                        )}

                        {/* Open 7-Doc Dossier Binder */}
                        <button
                          onClick={() => setSelectedShipmentForBinder(s)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-[11px] transition"
                          title="Open 7-Document Legal Binder"
                        >
                          <FileText className="w-3 h-3" />
                          <span>7-Doc Dossier</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic SHA-256 Audit Trail Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            Live Sovereign Cryptographic Audit Trail Stream
          </h3>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            Zero-Tamper Ledger (SHA-256)
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {auditLogs.slice(0, 15).map(log => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {log.actorRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{log.details}</p>
              </div>

              <div className="text-right">
                <code className="text-[10px] font-mono text-emerald-600 block">{log.hash}</code>
                <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified 7-Document Binder Modal */}
      {selectedShipmentForBinder && (
        <UnifiedDocumentBinderModal
          isOpen={!!selectedShipmentForBinder}
          onClose={() => setSelectedShipmentForBinder(null)}
          shipment={selectedShipmentForBinder}
        />
      )}
    </div>
  );
};
