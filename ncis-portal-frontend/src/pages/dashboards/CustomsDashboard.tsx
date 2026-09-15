import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shipment, CustomsDeclaration } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DutyCalculatorWidget } from '../../components/customs/DutyCalculatorWidget';
import { ValuationFraudWidget } from '../../components/customs/ValuationFraudWidget';
import { RevenueTrendChart, CustomsChannelDonutChart } from '../../components/charts/DashboardCharts';
import { TableToolbar } from '../../components/common/TableToolbar';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import { DeclarationPdfPreview } from '../../components/customs/DeclarationPdfPreview';
import { Modal } from '../../components/common/Modal';
import { MOCK_SHIPMENTS } from '../../services/mockData';
import {
  ShieldCheck,
  FileCheck,
  Scale,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Search,
} from 'lucide-react';

export const CustomsDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(MOCK_SHIPMENTS[0] || null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [assignedChannel, setAssignedChannel] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [channelSuccess, setChannelSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getShipments();
        if (data && data.length > 0) {
          setShipments(data);
          setSelectedShipment(data[0]);
        }
      } catch {
        // Fallback to MOCK_SHIPMENTS
      }
    }
    loadData();
  }, []);

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await api.updateStage(
        selectedShipment.id,
        'POST_CUSTOMS',
        `Customs declaration approved. Inspection channel set to ${assignedChannel}. Form C-30 generated.`
      );
      setChannelSuccess(true);
      setTimeout(() => {
        setChannelSuccess(false);
        setShowChannelModal(false);
      }, 1500);
    } catch {
      // Ignore
    }
  };

  const filteredShipments = shipments.filter(shp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      shp.trackingNumber?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.vin?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.make?.toLowerCase().includes(q) ||
      shp.importer?.fullName?.toLowerCase().includes(q);

    const matchesChannel = channelFilter === 'ALL' ||
      shp.customsDeclaration?.channel === channelFilter ||
      shp.customsAssessment?.channel === channelFilter;

    return matchesSearch && matchesChannel;
  });

  const handleExportCsv = () => {
    const headers = ['Tracking #', 'Importer', 'Vehicle Make/Model', 'Chassis/VIN', 'CIF (ETB)', 'Total Duty (ETB)', 'Channel', 'Payment Status'];
    const rows = filteredShipments.map(s => [
      s.trackingNumber || '',
      s.importer?.fullName || s.importer?.organization || '',
      `${s.vehicles?.[0]?.make || ''} ${s.vehicles?.[0]?.model || ''}`,
      s.vehicles?.[0]?.vin || '',
      s.customsDeclaration?.assessedCif || s.customsAssessment?.assessedCif || 0,
      s.customsDeclaration?.totalPayable || s.customsAssessment?.totalPayable || 0,
      s.customsDeclaration?.channel || s.customsAssessment?.channel || 'GREEN',
      s.customsDeclaration?.paymentStatus || s.customsAssessment?.paymentStatus || 'UNPAID'
    ]);
    exportToCsv('Customs_Assessment_Declarations', headers, rows);
  };

  const handleExportPdf = () => {
    exportToPrintPdf('Customs Assessment Declarations Roster');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
              <Scale className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ethiopian Customs Commission (ECC) Directorate</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Modjo & Kality Multimodal Customs Branches • Cascading tariff assessment, ASYCUDA integration, and Form C-30 clearance.
          </p>
        </div>

        {selectedShipment && (
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Generate Official Form C-30 PDF</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Pending Reviews</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">19 Declarations</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Modjo Customs Terminal</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Duty Realized Today</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">84.5M ETB</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">CBE RTGS Settled</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Physical Inspection Queue</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">4 Vehicles</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Red Channel Flagged</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Avg Processing Velocity</span>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">5.4 Hours</div>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Automated Tariff Engine</p>
        </div>
      </div>

      {/* ECC Statutory Valuation & Anti-Underinvoicing Risk Engine */}
      <ValuationFraudWidget />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomsChannelDonutChart />
        <RevenueTrendChart />
      </div>

      {/* Table Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedChannel={channelFilter}
        onChannelChange={setChannelFilter}
        config={{ channelFilter: true, stageFilter: false }}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        totalCount={shipments.length}
        filteredCount={filteredShipments.length}
      />

      {/* Customs Declaration Assessment Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Declaration Assessment & Channel Assignment Queue
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Customs Office: Modjo Multimodal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5 font-bold">Declaration No.</th>
                <th className="pb-2.5 font-bold">Vehicle Consignment</th>
                <th className="pb-2.5 font-bold">CIF Value (ETB)</th>
                <th className="pb-2.5 font-bold">Duty + Taxes (ETB)</th>
                <th className="pb-2.5 font-bold">Channel</th>
                <th className="pb-2.5 font-bold">Payment</th>
                <th className="pb-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {shipments.map((shp) => {
                const dec = shp.customsDeclaration;
                const v = shp.vehicles?.[0];
                return (
                  <tr key={shp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-sky-600 dark:text-sky-400 font-bold">
                      {dec?.declarationNumber || 'ECC-DEC-PENDING'}
                    </td>
                    <td className="py-3 font-sans text-slate-900 dark:text-white font-medium">
                      {v ? `${v.make} ${v.model} (${v.year})` : shp.title}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">
                       {dec ? (Number(dec.assessedCif) || 0).toLocaleString() : (Number(v?.cifValue) || 2500000).toLocaleString()} ETB
                     </td>
                     <td className="py-3 font-bold text-sky-700 dark:text-sky-300">
                       {dec ? (Number(dec.totalPayable) || 0).toLocaleString() : '5,062,875'} ETB
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dec?.channel === 'RED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : dec?.channel === 'YELLOW'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {dec?.channel || 'GREEN'}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={dec?.paymentStatus || 'UNPAID'} />
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowChannelModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition-colors shadow-sm"
                      >
                        Assess & Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowPdfModal(true);
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[11px] font-semibold transition-colors"
                      >
                        Form C-30
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cascading Duty Calculator Engine */}
      <DutyCalculatorWidget />

      {/* Channel Assessment Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showChannelModal}
          onClose={() => setShowChannelModal(false)}
          title={`Customs Clearance Assessment: ${selectedShipment.trackingNumber}`}
          subtitle="Assign Risk Inspection Channel & Issue Formal Release Order"
        >
          <form onSubmit={handleUpdateChannel} className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-slate-400 font-sans">
                Consignee: <strong className="text-white">{selectedShipment.importer?.organization || 'Ethio Auto Imports PLC'}</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Vehicle: <strong className="text-white">{selectedShipment.title}</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Assessed Total Duty: <strong className="text-sky-400">5,062,875 ETB</strong>
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 font-sans">Select Inspection Channel</label>
              <div className="grid grid-cols-3 gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setAssignedChannel('GREEN')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    assignedChannel === 'GREEN'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-sm">🟢 Green</span>
                  <span className="text-[10px] block mt-0.5">Direct Release</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedChannel('YELLOW')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    assignedChannel === 'YELLOW'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-sm">🟡 Yellow</span>
                  <span className="text-[10px] block mt-0.5">Document Audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedChannel('RED')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    assignedChannel === 'RED'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-sm">🔴 Red</span>
                  <span className="text-[10px] block mt-0.5">Physical Inspection</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowChannelModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5"
              >
                {channelSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{channelSuccess ? 'Declaration Approved!' : 'Authorize Customs Clearance'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PDF Form C-30 Preview Modal */}
      {selectedShipment && (
        <DeclarationPdfPreview
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          shipment={selectedShipment}
        />
      )}
    </div>
  );
};
