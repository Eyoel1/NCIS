import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shipment, FuelType } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DutyCalculatorWidget } from '../../components/customs/DutyCalculatorWidget';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';
import { Modal } from '../../components/common/Modal';
import { useTranslation } from '../../context/LanguageContext';
import {
  Package,
  PlusCircle,
  FileSearch,
  AlertCircle,
  Clock,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ImporterDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // New Shipment Form State
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Corolla Cross Hybrid');
  const [year, setYear] = useState(2024);
  const [engineCc, setEngineCc] = useState(1800);
  const [fuelType, setFuelType] = useState<FuelType>('HYBRID');
  const [cifValue, setCifValue] = useState(2850000);
  const [vin, setVin] = useState('');
  const [creating, setCreating] = useState(false);

  // Dispute ticket state
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('VALUATION_DISPUTE');
  const [ticketMessage, setTicketMessage] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  useEffect(() => {
    async function loadShipments() {
      try {
        const data = await api.getShipments();
        setShipments(data);
        if (data.length > 0) setSelectedShipmentId(data[0].id);
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    loadShipments();
  }, []);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await api.createShipment({
        make,
        model,
        year,
        engineCc,
        fuelType,
        cifValue,
        vin: vin || `ETH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        originPort: 'Jebel Ali, UAE',
        destinationPort: 'Modjo Dry Port',
      });
      setShipments((prev) => [created, ...prev]);
      setShowNewShipmentModal(false);
    } catch {
      // Ignore
    } finally {
      setCreating(false);
    }
  };

  const handleAutoFillFromOcr = (ocr: any) => {
    if (!ocr) return;
    const getVal = (field: any) => {
      if (field === null || field === undefined) return undefined;
      if (typeof field === 'object' && 'value' in field) return field.value;
      return field;
    };

    const makeVal = getVal(ocr.make);
    const modelVal = getVal(ocr.model);
    const yearVal = getVal(ocr.year ?? ocr.productionYear);
    const engineCcVal = getVal(ocr.engineCc ?? ocr.engineDisplacementCc);
    const fuelVal = getVal(ocr.fuelType);
    const vinVal = getVal(ocr.vin ?? ocr.chassisNumber);
    const cifVal = getVal(ocr.cifEtb ?? ocr.cifValue);

    if (makeVal) setMake(String(makeVal));
    if (modelVal) setModel(String(modelVal));
    if (yearVal) setYear(Number(yearVal) || 2024);
    if (engineCcVal) setEngineCc(Number(engineCcVal) || 1800);
    if (fuelVal) setFuelType(String(fuelVal).toUpperCase() as FuelType);
    if (vinVal) setVin(String(vinVal));
    if (cifVal) setCifValue(Number(cifVal) || 2850000);
    setShowNewShipmentModal(true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTicket({
        shipmentId: selectedShipmentId,
        title: ticketTitle,
        category: ticketCategory,
        message: ticketMessage,
      });
      setTicketSubmitted(true);
      setTimeout(() => {
        setTicketSubmitted(false);
        setShowTicketModal(false);
      }, 1500);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Package className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Importer / Supplier Logistics Command</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ethio Auto Imports PLC • Commercial consignments, customs tariff estimates, and B/L vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOcrModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold text-xs border border-slate-700 transition-colors"
          >
            <FileSearch className="h-4 w-4" />
            <span>Upload Document (OCR)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewShipmentModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('actions.newShipment', 'New Import Order')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Active Shipments</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{shipments.length}</div>
          <p className="text-[11px] text-sky-400 mt-0.5">Under Active Surveillance</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">In-Transit En Route</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {shipments.filter((s) => s.currentStage === 'SHIPPING' || s.currentStage === 'POST_CUSTOMS').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Maritime & Road Corridors</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Pending Duty Settlements</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">5.27M</div>
          <p className="text-[11px] text-slate-400 mt-0.5">ETB Awaiting CBE Transfer</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Cleared & Registered</span>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">
            {shipments.filter((s) => s.currentStage === 'DELIVERY').length}
          </div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Plates Allocated</p>
        </div>
      </div>

      {/* Active Consignments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Active Vehicle Import Consignments
          </h2>
          <button
            type="button"
            onClick={() => setShowTicketModal(true)}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Open Dispute Query</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Tracking Number</th>
                <th className="pb-2.5">Vehicle Details</th>
                <th className="pb-2.5">Chassis / VIN</th>
                <th className="pb-2.5">Route</th>
                <th className="pb-2.5">Lifecycle Stage</th>
                <th className="pb-2.5">Risk Rating</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shipments.map((shp) => {
                const v = shp.vehicles?.[0];
                return (
                  <tr key={shp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-sky-400 font-bold">{shp.trackingNumber}</td>
                    <td className="py-3 font-sans text-white font-medium">
                      {v ? `${v.make} ${v.model} (${v.year})` : shp.title}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">{v?.vin || 'VIN-PENDING'}</td>
                    <td className="py-3 font-sans text-slate-300 text-[11px]">
                      {shp.originPort.split(',')[0]} → {shp.destinationPort.split(',')[0]}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={shp.currentStage} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={shp.delayRiskRating} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/track/${shp.trackingNumber}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold transition-colors"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duty Calculator Section */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-sky-400" />
          Pro-Forma Customs Duty & Tax Estimator
        </h2>
        <DutyCalculatorWidget />
      </div>

      {/* New Shipment Wizard Modal */}
      <Modal
        isOpen={showNewShipmentModal}
        onClose={() => setShowNewShipmentModal(false)}
        title="Submit New Vehicle Import Declaration"
        subtitle="Registers documentary L/C and commercial proforma into the national system"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Vehicle Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Year of Manufacture</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Engine Displacement (cc)</label>
              <input
                type="number"
                value={engineCc}
                onChange={(e) => setEngineCc(Number(e.target.value))}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ELECTRIC">Electric (EV)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Declared CIF Value (ETB)</label>
              <input
                type="number"
                value={cifValue}
                onChange={(e) => setCifValue(Number(e.target.value))}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Chassis VIN Number</label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Leave empty for auto-generated VIN (e.g. JTJHY7AX8N...)"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowNewShipmentModal(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {creating ? 'Registering...' : 'Register Consignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* OCR Extraction Modal */}
      <DocumentUploadModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onAutoFill={handleAutoFillFromOcr}
      />

      {/* Dispute Ticketing Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Open Customs / Transit Dispute Ticket"
        subtitle="Submit formal inquiry to Customs Commission or Port Operator"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Target Shipment</label>
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} - {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Dispute Category</label>
            <select
              value={ticketCategory}
              onChange={(e) => setTicketCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="VALUATION_DISPUTE">Tariff Valuation Dispute (Depreciation / CC)</option>
              <option value="CUSTOMS_HOLD">Customs Clearance Hold</option>
              <option value="PORT_DELAY">Port Dwell Demurrage Waiver Request</option>
              <option value="INSPECTION_FAIL">Technical Inspection Re-evaluation</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Subject / Summary</label>
            <input
              type="text"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              placeholder="e.g. Valuation review for 2024 Hybrid rebate"
              required
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Detailed Inquiry & Justification</label>
            <textarea
              rows={4}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Specify references to relevant customs declaration lines, proforma invoice numbers..."
              required
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTicketModal(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {ticketSubmitted ? <CheckCircle2 className="h-4 w-4" /> : null}
              <span>{ticketSubmitted ? 'Submitted!' : 'Submit Dispute'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
