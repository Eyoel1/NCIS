import React, { useState, useEffect } from 'react';
import { useShipments } from '../../context/ShipmentContext';
import { LibreCertificateModal } from '../../components/registration/LibreCertificateModal';
import { TableToolbar } from '../../components/common/TableToolbar';
import { exportToCsv } from '../../utils/exportCsv';
import { exportToPrintPdf } from '../../utils/exportPdf';
import { api } from '../../services/api';
import { Shipment, Vehicle } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { VehicleQrModal } from '../../components/qr/VehicleQrModal';
import {
  Award,
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Car,
  QrCode,
  Check,
  Tag,
  Search,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RegistrationDashboard: React.FC = () => {
  const { shipments, inspectAndIssueLibre } = useShipments();
  const navigate = useNavigate();

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showLibreModal, setShowLibreModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Inspection Checklist
  const [chassisVerified, setChassisVerified] = useState(true);
  const [engineVerified, setEngineVerified] = useState(true);
  const [emissionsPassed, setEmissionsPassed] = useState(true);
  const [brakesPassed, setBrakesPassed] = useState(true);
  const [inspectionSuccess, setInspectionSuccess] = useState(false);

  // Plate allocation
  const [regionCode, setRegionCode] = useState('AA');
  const [vehicleCode, setVehicleCode] = useState('Code 2 (Private)');
  const [plateNumber, setPlateNumber] = useState('2-B84920 AA');
  const [plateSuccess, setPlateSuccess] = useState(false);
  const [completedShipment, setCompletedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    if (shipments.length > 0 && !selectedShipment) {
      setSelectedShipment(shipments[0]);
    }
  }, [shipments, selectedShipment]);

  const handleRecordInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setInspectionSuccess(true);
    setTimeout(() => {
      setInspectionSuccess(false);
      setShowInspectionModal(false);
    }, 1200);
  };

  const handleAllocatePlate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    await inspectAndIssueLibre(selectedShipment.id, plateNumber);
    setPlateSuccess(true);
    const updated = {
      ...selectedShipment,
      currentStage: 'DELIVERY' as const,
      status: 'REGISTERED_TITLED' as any,
      vehicles: selectedShipment.vehicles?.map(v => ({
        ...v,
        registrationPlate: plateNumber,
        titleIssued: true,
      }))
    };
    setCompletedShipment(updated);
    setTimeout(() => {
      setPlateSuccess(false);
      setShowPlateModal(false);
    }, 1200);
  };

  const filteredShipments = shipments.filter(shp => {
    const q = searchQuery.toLowerCase();
    return !q ||
      shp.trackingNumber?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.vin?.toLowerCase().includes(q) ||
      shp.vehicles?.[0]?.make?.toLowerCase().includes(q) ||
      shp.importer?.fullName?.toLowerCase().includes(q);
  });

  const handleExportCsv = () => {
    const headers = ['VIN / Chassis', 'Make & Model', 'Engine (CC)', 'Fuel Type', 'Owner', 'Plate #', 'Title Issued'];
    const rows = filteredShipments.map(s => [
      s.vehicles?.[0]?.vin || '',
      `${s.vehicles?.[0]?.make || ''} ${s.vehicles?.[0]?.model || ''}`,
      s.vehicles?.[0]?.engineCc || '',
      s.vehicles?.[0]?.fuelType || '',
      s.importer?.fullName || '',
      s.vehicles?.[0]?.registrationPlate || 'Unassigned',
      s.vehicles?.[0]?.titleIssued ? 'YES' : 'NO'
    ]);
    exportToCsv('MOTL_Vehicle_Registrations', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Award className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Federal Transport Authority (FTA) Registration Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ministry of Transport & Logistics (MOTL) • Technical roadworthiness inspection, plate allocation, and digital vehicle title issuance.
          </p>
        </div>
      </div>

      {/* Title Issued Celebration Banner */}
      {completedShipment && (
        <div className="p-5 rounded-2xl border-2 border-teal-500/40 bg-teal-950/30 backdrop-blur-sm shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-teal-400 uppercase tracking-wide">
                  Digital Libre Title Issued & Registered: {completedShipment.trackingNumber}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-black text-xs">
                  Plate: {completedShipment.vehicles?.[0]?.registrationPlate || plateNumber}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                {completedShipment.vehicles?.[0]?.make} {completedShipment.vehicles?.[0]?.model} ({completedShipment.vehicles?.[0]?.year}) — Chassis: {completedShipment.vehicles?.[0]?.vin}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                National Single Window Import Cycle Complete! The vehicle has passed roadworthiness verification, customs clearance has been settled, and sovereign ownership has been sealed onto the cryptographic ledger.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedShipment(completedShipment);
                setShowLibreModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <Award className="w-4 h-4" />
              <span>View Official Digital Libre</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/track/${completedShipment.trackingNumber}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Track Full Lifecycle</span>
            </button>

            <button
              type="button"
              onClick={() => setCompletedShipment(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Ready for Final Title</span>
          <div className="text-2xl font-black text-white font-mono mt-1">12 Units</div>
          <p className="text-[11px] text-sky-400 mt-0.5">Kality Testing Station</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Inspections Passed Today</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">15 Units</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">100% Safety Compliance</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">License Plates Issued</span>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">38 Sets</div>
          <p className="text-[11px] text-emerald-400 mt-0.5">Addis Ababa & Oromia</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase">Digital Ownership Logbooks</span>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">8,410 Titles</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Cryptographically Sealed</p>
        </div>
      </div>

      {/* Vehicle Registration & Inspection Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Car className="h-4 w-4 text-sky-400" />
            Vehicle Inspection & Title Issuance Roster
          </span>
          <span className="text-xs text-slate-400">FTA Vehicle Inspection Bay 2</span>
        </div>

        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          config={{
            searchPlaceholder: 'Search by plate, VIN, make, or owner...',
          }}
          onExportCsv={handleExportCsv}
          onExportPdf={() => exportToPrintPdf('MOTL_Vehicle_Registrations')}
          totalCount={shipments.length}
          filteredCount={filteredShipments.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Chassis / VIN</th>
                <th className="pb-2.5">Make & Model</th>
                <th className="pb-2.5">Engine / Fuel</th>
                <th className="pb-2.5">Owner / Consignee</th>
                <th className="pb-2.5">Allocated Plate</th>
                <th className="pb-2.5 text-right">Inspection & Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredShipments.map((shp) => {
                const v = shp.vehicles?.[0];
                return (
                  <tr key={shp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-sky-400 font-bold">{v?.vin || 'VIN-PENDING'}</td>
                    <td className="py-3 font-sans text-white font-medium">
                      {v ? `${v.make} ${v.model} (${v.year})` : shp.title}
                    </td>
                    <td className="py-3 text-slate-300 font-sans text-[11px]">
                      {v?.engineCc}cc • {v?.fuelType}
                    </td>
                    <td className="py-3 font-sans text-slate-400">
                      {shp.importer?.organization || 'Ethio Auto Imports PLC'}
                    </td>
                    <td className="py-3">
                      {v?.registrationPlate ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          {v.registrationPlate}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not Allocated</span>
                      )}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {(v?.titleIssued || shp.currentStage === 'DELIVERY') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShipment(shp);
                            setShowLibreModal(true);
                          }}
                          className="px-2.5 py-1 rounded bg-teal-900/80 hover:bg-teal-800 text-teal-200 border border-teal-700 text-[11px] font-bold transition-colors"
                        >
                          View Libre
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowInspectionModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        Inspection
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowPlateModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-800 text-[11px] font-semibold transition-colors"
                      >
                        Assign Plate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setShowQrModal(true);
                        }}
                        className="px-2 py-1 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800 text-[11px] font-semibold transition-colors"
                      >
                        QR Pass
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Inspection Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showInspectionModal}
          onClose={() => setShowInspectionModal(false)}
          title={`MOTL Roadworthiness Inspection: ${selectedShipment.title}`}
          subtitle="Record Mandatory Physical and Emissions Verification Checklist"
        >
          <form onSubmit={handleRecordInspection} className="space-y-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={chassisVerified}
                  onChange={(e) => setChassisVerified(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-900"
                />
                <span>Chassis Number Stamping matches Customs Declaration exactly</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={engineVerified}
                  onChange={(e) => setEngineVerified(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-900"
                />
                <span>Engine displacement and serial tag confirmed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={emissionsPassed}
                  onChange={(e) => setEmissionsPassed(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-900"
                />
                <span>Euro-4 Emissions Standard compliant (Smoke / CO Test Passed)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={brakesPassed}
                  onChange={(e) => setBrakesPassed(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-900"
                />
                <span>Dual-circuit service brakes & parking brake 100% responsive</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowInspectionModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
              >
                {inspectionSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{inspectionSuccess ? 'Inspection Certified!' : 'Certify Roadworthiness'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Plate Allocation Modal */}
      {selectedShipment && (
        <Modal
          isOpen={showPlateModal}
          onClose={() => setShowPlateModal(false)}
          title={`Allocate Ethiopian License Plate: ${selectedShipment.title}`}
          subtitle="Generate Official Plate Number & Register Digital Title"
        >
          <form onSubmit={handleAllocatePlate} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 font-sans">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Region / Jurisdiction</label>
                <select
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="AA">Addis Ababa (AA)</option>
                  <option value="OR">Oromia (OR)</option>
                  <option value="AM">Amhara (AM)</option>
                  <option value="DR">Dire Dawa (DR)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Classification Code</label>
                <select
                  value={vehicleCode}
                  onChange={(e) => setVehicleCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Code 2 (Private)">Code 2 (Private Automobile)</option>
                  <option value="Code 3 (Commercial)">Code 3 (Commercial Freight)</option>
                  <option value="Code 4 (Government)">Code 4 (Governmental)</option>
                  <option value="Code 1 (Taxi)">Code 1 (Public Transport)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 font-sans">Allocated Plate Number</label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-black text-sm text-center tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setShowPlateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5"
              >
                {plateSuccess && <CheckCircle2 className="h-4 w-4" />}
                <span>{plateSuccess ? 'Plate Allocated!' : 'Issue Plate & Digital Title'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Modal */}
      {selectedShipment && selectedShipment.vehicles?.[0] && (
        <VehicleQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          shipment={selectedShipment}
          vehicle={selectedShipment.vehicles[0]}
        />
      )}

      {/* Official Digital Libre Certificate Modal */}
      {selectedShipment && (
        <LibreCertificateModal
          isOpen={showLibreModal}
          onClose={() => setShowLibreModal(false)}
          vehicle={{
            vin: selectedShipment.vehicles?.[0]?.vin || 'ETH9283741829',
            make: selectedShipment.vehicles?.[0]?.make || 'Toyota',
            model: selectedShipment.vehicles?.[0]?.model || 'Corolla Cross',
            year: selectedShipment.vehicles?.[0]?.year || 2024,
            engineCc: selectedShipment.vehicles?.[0]?.engineCc || 1800,
            fuelType: selectedShipment.vehicles?.[0]?.fuelType || 'HYBRID',
            color: selectedShipment.vehicles?.[0]?.color || 'Silver Metallic',
            ownerName: selectedShipment.importer?.organization || selectedShipment.importer?.fullName || 'Ethio Auto Imports PLC',
            plateNumber: selectedShipment.vehicles?.[0]?.registrationPlate || plateNumber || '2-B84920 AA',
            registrationDate: new Date().toLocaleDateString(),
            certificateNumber: `FDRE-MOTL-${selectedShipment.id.substring(4).toUpperCase()}`
          }}
        />
      )}
    </div>
  );
};
