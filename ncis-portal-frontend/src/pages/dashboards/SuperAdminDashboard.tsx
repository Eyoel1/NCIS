import React, { useState, useEffect } from 'react';
import { NationalSlaHeatmapWidget } from '../../components/admin/NationalSlaHeatmapWidget';
import { RevenueTrendChart, PortCongestionBarChart } from '../../components/charts/DashboardCharts';
import { TableToolbar } from '../../components/common/TableToolbar';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import { api } from '../../services/api';
import { DEMO_USERS } from '../../context/AuthContext';
import { UserRole, AuditLog } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import {
  ShieldAlert,
  CheckCircle2,
  Users,
  Key,
  Sliders,
  Server,
  RefreshCw,
  Search,
  Lock,
  History,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    verifiedBlocks: number;
    message: string;
  } | null>(null);

  // Simulation controls state
  const [djiboutiCongestion, setDjiboutiCongestion] = useState(78);
  const [asycudaStatus, setAsycudaStatus] = useState<'OPERATIONAL' | 'DEGRADED' | 'OFFLINE'>('OPERATIONAL');
  const [bankLatencyMs, setBankLatencyMs] = useState(150);

  useEffect(() => {
    async function loadLogs() {
      try {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyChain();
      setVerifyResult(res);
    } catch {
      setVerifyResult({
        valid: false,
        verifiedBlocks: 0,
        message: 'Cryptographic chain verification failed.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const roles = Object.keys(DEMO_USERS) as UserRole[];

  const filteredAuditLogs = auditLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    return !q ||
      log.action?.toLowerCase().includes(q) ||
      log.actorName?.toLowerCase().includes(q) ||
      log.actorRole?.toLowerCase().includes(q) ||
      log.hash?.toLowerCase().includes(q);
  });

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'SHA-256 Digest'];
    const rows = filteredAuditLogs.map(l => [
      l.timestamp || '',
      l.actorName || '',
      l.actorRole || '',
      l.action || '',
      l.hash || ''
    ]);
    exportToCsv('Cryptographic_Audit_Trail', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Super Admin National Command Console</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System governance, multi-agency role directory, and cryptographic audit log chain verification.
          </p>
        </div>

        <button
          type="button"
          onClick={handleVerifyChain}
          disabled={verifying}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
          <span>{verifying ? 'Auditing SHA-256 Chain...' : 'Verify Cryptographic Chain'}</span>
        </button>
      </div>

      {/* Chain Verification Result Banner */}
      {verifyResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            verifyResult.valid
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-xs block">
                {verifyResult.valid ? 'INTEGRITY VERIFIED' : 'INTEGRITY MISMATCH'}
              </span>
              <span className="text-[11px] opacity-90">{verifyResult.message}</span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700">
            {verifyResult.verifiedBlocks} Blocks Checked
          </span>
        </div>
      )}

      {/* Row 1: System Monitoring & Simulation Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulation Controls */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-400" />
              External Systems Simulation Matrix
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              LIVE HOOKS
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-medium">Djibouti Port Terminal Congestion:</span>
                <span className="font-mono font-bold text-sky-400">{djiboutiCongestion}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={djiboutiCongestion}
                onChange={(e) => setDjiboutiCongestion(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-medium">ASYCUDA World Customs Gateway:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    asycudaStatus === 'OPERATIONAL'
                      ? 'bg-emerald-950 text-emerald-400'
                      : asycudaStatus === 'DEGRADED'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-rose-950 text-rose-400'
                  }`}
                >
                  {asycudaStatus}
                </span>
              </div>
              <div className="flex gap-2">
                {(['OPERATIONAL', 'DEGRADED', 'OFFLINE'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAsycudaStatus(s)}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold border transition-colors ${
                      asycudaStatus === s
                        ? 'bg-slate-800 text-white border-sky-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-medium">Commercial Bank L/C Gateway Latency:</span>
                <span className="font-mono font-bold text-emerald-400">{bankLatencyMs} ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={bankLatencyMs}
                onChange={(e) => setBankLatencyMs(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              Infrastructure & Node Telemetry
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              HEALTHY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Core Database</span>
              <span className="text-white font-bold font-mono">SQLite (WAL Mode)</span>
              <p className="text-[10px] text-emerald-400 mt-1">9 Models Synchronized</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Audit Engine</span>
              <span className="text-white font-bold font-mono">SHA-256 Merkle Chain</span>
              <p className="text-[10px] text-emerald-400 mt-1">Zero Tamper Tolerance</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Fastify REST Port</span>
              <span className="text-sky-400 font-bold font-mono">:4000 Operational</span>
              <p className="text-[10px] text-slate-400 mt-1">CORS & JWT Guards Active</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">2FA Bypass Security</span>
              <span className="text-amber-400 font-bold font-mono">Demo Mode (123456)</span>
              <p className="text-[10px] text-slate-400 mt-1">Active for Test & Audit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Stakeholder Users Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" />
            Institutional Stakeholder Registry (8 Agency Personas)
          </span>
          <span className="text-xs text-slate-400">8 of 8 Roles Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Stakeholder Role</th>
                <th className="pb-2.5">Designated Officer</th>
                <th className="pb-2.5">Organization</th>
                <th className="pb-2.5">Official Email</th>
                <th className="pb-2.5">2FA Security</th>
                <th className="pb-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {roles.map((r) => {
                const u = DEMO_USERS[r];
                return (
                  <tr key={r} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-sans font-bold text-white">
                      {t(`roles.${r}`, r.replace(/_/g, ' '))}
                    </td>
                    <td className="py-2.5 font-sans text-slate-200">{u.fullName}</td>
                    <td className="py-2.5 font-sans text-slate-400">{u.organization}</td>
                    <td className="py-2.5 text-sky-400">{u.email}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                        Demo 2FA (123456)
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Cryptographic Audit Trail Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            Immutable Audit Trail Stream (SHA-256 Hash Chain)
          </span>
          <span className="text-xs text-slate-400 font-mono">{auditLogs.length} Records Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Timestamp</th>
                <th className="pb-2.5">Actor & Agency</th>
                <th className="pb-2.5">Action Executed</th>
                <th className="pb-2.5">Details</th>
                <th className="pb-2.5">SHA-256 Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 font-sans font-medium text-white">
                    {log.actorName || log.actorRole || 'System'}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 font-sans text-slate-300 truncate max-w-xs">
                    {log.details || 'Lifecycle transition recorded'}
                  </td>
                  <td className="py-2.5 text-[10px] text-slate-400 truncate max-w-[150px]" title={log.hash}>
                    {log.hash.substring(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
