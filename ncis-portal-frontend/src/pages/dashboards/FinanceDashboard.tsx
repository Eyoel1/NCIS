import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shipment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Landmark,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  FileCheck,
  Building2,
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Modals
  const [showLcModal, setShowLcModal] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  const [lcSuccess, setLcSuccess] = useState(false);
  const [escrowSuccess, setEscrowSuccess] = useState(false);
  const [insuranceSuccess, setInsuranceSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await api.getShipments();
      setShipments(data);
      if (data.length > 0) setSelectedShipment(data[0]);
    }
    loadData();
  }, []);

  const handleValidateLc = async (e: React.FormEvent) => {
    e.preventDefault();
    setLcSuccess(true);
    setTimeout(() => {
      setLcSuccess(false);
      setShowLcModal(false);
    }, 1500);
  };

  const handleSettleEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await api.updateStage(
        selectedShipment.id,
        'CUSTOMS',
        'Customs duty escrow settlement cleared via CBE RTGS. Tax receipt transmitted to ECC.'
      );
      setEscrowSuccess(true);
      setTimeout(() => {
        setEscrowSuccess(false);
        setShowEscrowModal(false);
      }, 1500);
    } catch {
      // Ignore
    }
  };

  const handleIssueInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    setInsuranceSuccess(true);
    setTimeout(() => {
      setInsuranceSuccess(false);
      setShowInsuranceModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Landmark className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Commercial Banking & Marine Insurance Directorate</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Commercial Bank of Ethiopia (CBE) & Nyala Insurance • L/C validation, marine cargo policies, and duty escrow settlements.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Active Letters of Credit</span>
          <div className="text-2xl font-black text-white font-mono mt-1">18 L/Cs</div>
          <p className="text-[11px] text-sky-400 mt-0.5">CBE Trade Finance</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Duty Payments Settled</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">342M ETB</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Real-time RTGS Clearance</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Marine Cargo Policies</span>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">27 Active</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Full All-Risk Coverage</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Escrow Guarantee Balance</span>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">1.2B ETB</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">ECC Collateral Vault</p>
        </div>
      </div>

      {/* CBE Trade Finance & Insurance Operations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            Consignment Financial Instruments & Customs Duty Escrow
          </span>
          <span className="text-xs text-slate-400">Institutional Bank Verification</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Tracking Number</th>
                <th className="pb-2.5">Importer / Consignee</th>
                <th className="pb-2.5">Vehicle</th>
                <th className="pb-2.5">Duty Amount (ETB)</th>
                <th className="pb-2.5">Payment State</th>
                <th className="pb-2.5 text-right">Banking Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shipments.map((shp) => {
                const dec = shp.customsDeclaration;
                return (
                  <tr key={shp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-sky-400 font-bold">{shp.trackingNumber}</td>
                    <td className="py-3 font-sans text-slate-300">
                      {shp.importer?.organization || 'Ethio Auto Imports PLC'}
                    </td>
                    <td className="py-3 font-sans text-white">{shp.title}</td>
                    <td className="py-3 text-sky-300 font-bold">
                      {dec ? dec.totalPayable.toLocaleString() : '5,062,875'} ETB
                    </td>
                    <td className="py-3">
                      <StatusBadge status={dec?.paymentStatus || 'UNPAID'} />
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowLcModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        Verify L/C
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowInsuranceModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800 text-[11px] font-semibold transition-colors"
                      >
                        Policy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowEscrowModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-semibold transition-colors"
                      >
                        Settle Escrow
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* L/C Verification Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showLcModal}
          onClose={() => setShowLcModal(false)}
          title={`Validate CBE Letter of Credit (L/C): ${selectedShipment.trackingNumber}`}
          subtitle="Commercial Bank of Ethiopia • Foreign Exchange Trade Validation"
        >
          <form onSubmit={handleValidateLc} className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-slate-400 font-sans">
                L/C Authorization Number: <strong className="text-white">CBE-LC-2026-00492</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Authorized Importer: <strong className="text-white">{selectedShipment.importer?.organization || 'Ethio Auto Imports PLC'}</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Commercial Invoice Match: <strong className="text-emerald-400">100% (VIN, FOB, Freight Matched)</strong>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowLcModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5"
              >
                {lcSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{lcSuccess ? 'L/C Endorsed!' : 'Endorse Bank L/C'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Insurance Policy Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showInsuranceModal}
          onClose={() => setShowInsuranceModal(false)}
          title={`Issue Marine & Transit Insurance Policy: ${selectedShipment.trackingNumber}`}
          subtitle="Nyala Insurance S.C. • Marine All-Risks Clause (A)"
        >
          <form onSubmit={handleIssueInsurance} className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-slate-400 font-sans">
                Policy Number: <strong className="text-white">NYALA-MAR-2026-88192</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Insured Value: <strong className="text-white">3,450,000 ETB (110% of CIF)</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Transit Coverage: <strong className="text-purple-400">Port of Departure → Port of Djibouti → Modjo Terminal</strong>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowInsuranceModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5"
              >
                {insuranceSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{insuranceSuccess ? 'Policy Issued!' : 'Issue Insurance Certificate'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Duty Escrow Settlement Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showEscrowModal}
          onClose={() => setShowEscrowModal(false)}
          title={`Execute Duty Escrow Settlement: ${selectedShipment.trackingNumber}`}
          subtitle="Transfer Customs Duties to Ethiopian Customs Commission Revenue Account"
        >
          <form onSubmit={handleSettleEscrow} className="space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-slate-400 font-sans">
                Debited Account: <strong className="text-white">Ethio Auto Imports PLC (CBE #10001892841)</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Credited Treasury: <strong className="text-white">ECC National Revenue Account (#1000000001)</strong>
              </p>
              <p className="text-slate-400 font-sans">
                Payment Amount: <strong className="text-emerald-400 text-sm">5,062,875 ETB</strong>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowEscrowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
              >
                {escrowSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{escrowSuccess ? 'Escrow Cleared!' : 'Confirm RTGS Settlement'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
