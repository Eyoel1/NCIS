import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Shipment } from '../types';
import { LifecycleStepper } from '../components/tracking/LifecycleStepper';
import { ActivityTimeline } from '../components/tracking/ActivityTimeline';
import { VehiclePhotoGallery } from '../components/tracking/VehiclePhotoGallery';
import { VehicleDossierCard } from '../components/tracking/VehicleDossierCard';
import { CorridorMap } from '../components/map/CorridorMap';
import { StatusBadge } from '../components/common/StatusBadge';
import { useTranslation } from '../context/LanguageContext';
import { useShipments } from '../context/ShipmentContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ArrowLeft,
  ShieldCheck,
  Clock,
  AlertTriangle,
  History,
  FileCheck2,
  CheckCircle,
  Hash,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const PublicTrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { shipments: liveShipments } = useShipments();
  const { setRole } = useAuth();

  const [searchVin, setSearchVin] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError(null);

      const raw = decodeURIComponent(id).trim();
      const clean = raw.toUpperCase();
      const norm = clean.replace(/[^A-Z0-9]/g, '');

      // 1. Check live shipments from ShipmentContext first
      const matchString = (target?: string | null) => {
        if (!target) return false;
        const tClean = target.trim().toUpperCase();
        const tNorm = tClean.replace(/[^A-Z0-9]/g, '');
        return (
          tClean === clean ||
          tNorm === norm ||
          tClean.replace(/[\s_]+/g, '-') === clean.replace(/[\s_]+/g, '-')
        );
      };

      const foundLive = liveShipments.find(
        (s) =>
          matchString(s.trackingNumber) ||
          matchString(s.id) ||
          matchString(s.billOfLadingNumber) ||
          s.vehicles?.some((v) => matchString(v.vin) || matchString(v.registrationPlate))
      );

      if (foundLive && mounted) {
        const stages = ['PRE_IMPORT', 'SHIPPING', 'PORT_OPERATIONS', 'CUSTOMS', 'POST_CUSTOMS', 'DELIVERY', 'COMPLETED'];
        const idx = stages.indexOf(foundLive.currentStage);
        const formatted: any = {
          ...foundLive,
          title: foundLive.title || `${foundLive.vehicles?.[0]?.make || 'Vehicle'} ${foundLive.vehicles?.[0]?.model || ''}`.trim(),
          currentLocation: {
            name: foundLive.currentLocationName || 'In Transit Corridor',
            latitude: foundLive.currentLatitude || 11.595,
            longitude: foundLive.currentLongitude || 43.148,
          },
          lifecycleMilestones: stages.map((stage, i) => ({
            stage,
            completed: i < idx || foundLive.currentStage === 'COMPLETED',
            inProgress: i === idx && foundLive.currentStage !== 'COMPLETED',
            timestamp: foundLive.auditLogs?.find((l) => l.stage === stage)?.timestamp || null,
          })),
        };
        setShipment(formatted);
        setLoading(false);
        return;
      }

      // 2. Fallback to API
      try {
        const data = await api.trackPublic(raw);
        if (mounted) {
          setShipment(data as Shipment);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Unable to locate shipment dossier.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [id, liveShipments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVin.trim()) {
      const formatted = searchVin.trim().replace(/\s+/g, '-');
      navigate(`/track/${encodeURIComponent(formatted)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Portal Home</span>
        </button>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchVin}
              onChange={(e) => setSearchVin(e.target.value)}
              placeholder="Track another VIN / ID..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto mb-4" />
          <p className="text-xs text-slate-400">Locating authenticated shipment dossier...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-6 rounded-2xl text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">No Shipment Found</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/track/ET-SHP-2026-001')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-mono text-xs rounded-xl transition-colors inline-block"
          >
            Load Sample Dossier: ET-SHP-2026-001
          </button>
        </div>
      )}

      {shipment && !loading && (
        <div className="space-y-6">
          {/* Tracking Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase">Tracking Number:</span>
                <span className="text-base font-mono font-black text-sky-400">
                  {shipment.trackingNumber}
                </span>
                <StatusBadge status={shipment.currentStage} />
                <StatusBadge status={shipment.delayRiskRating + '_RISK'} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Routing: <strong className="text-white">{shipment.originPort}</strong> →{' '}
                <strong className="text-white">{shipment.transitPort || 'Port of Djibouti'}</strong> →{' '}
                <strong className="text-white">{shipment.destinationPort}</strong>
              </p>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400 block text-[11px]">Current Telematics Hub:</span>
              <span className="font-semibold text-white">
                {shipment.currentLocation?.name || shipment.currentLocationName || 'In Transit'}
              </span>
            </div>
          </div>

          {/* Next Stage Interactive Regulatory Flow Guide */}
          <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-950/30 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-sky-400 font-bold block">
                  Current Pipeline Stage: {shipment.currentStage.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  {shipment.currentStage === 'PRE_IMPORT' && 'Waiting for Commercial Bank of Ethiopia (CBE) Foreign Exchange allocation & L/C issuance.'}
                  {shipment.currentStage === 'SHIPPING' && 'L/C approved. Vessel in transit; awaiting Ocean Bill of Lading (e-B/L) endorsement.'}
                  {shipment.currentStage === 'PORT_OPERATIONS' && 'Vessel docked at Doraleh Port; awaiting yard slot allocation and gate-out clearance.'}
                  {shipment.currentStage === 'CUSTOMS' && 'Container arrived at Modjo; awaiting Ethiopian Customs Commission (ECC) Form C-30 tax assessment.'}
                  {shipment.currentStage === 'POST_CUSTOMS' && 'Customs cleared; ECTS telematics smart seal active on Addis-Djibouti transit convoy.'}
                  {shipment.currentStage === 'DELIVERY' && 'Vehicle arrived at Kality depot; awaiting physical inspection and Digital Libre title issuance.'}
                  {shipment.currentStage === 'COMPLETED' && 'Vehicle is officially registered with regional plates and sovereign Digital Libre!'}
                </p>
              </div>
            </div>

            {shipment.currentStage === 'PRE_IMPORT' && (
              <button
                type="button"
                onClick={() => {
                  setRole('FINANCIAL_INSTITUTION');
                  navigate('/dashboard/financial-institution');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Switch to CBE & Authorize FX</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {shipment.currentStage === 'SHIPPING' && (
              <button
                type="button"
                onClick={() => {
                  setRole('SHIPPING_LINE');
                  navigate('/dashboard/shipping-lines');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Switch to Carrier & Issue e-B/L</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {shipment.currentStage === 'PORT_OPERATIONS' && (
              <button
                type="button"
                onClick={() => {
                  setRole('PORT_OPERATOR');
                  navigate('/dashboard/port-terminal-operators');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Switch to Port & Issue Gate-Out</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {shipment.currentStage === 'CUSTOMS' && (
              <button
                type="button"
                onClick={() => {
                  setRole('CUSTOMS_AUTHORITY');
                  navigate('/dashboard/customs-broker');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Switch to Customs & Assess Form C-30</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {shipment.currentStage === 'POST_CUSTOMS' && (
              <button
                type="button"
                onClick={() => {
                  setRole('TRANSPORT_FORWARDER');
                  navigate('/dashboard/transport-logistics');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Switch to Fleet & Log Arrival</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {shipment.currentStage === 'DELIVERY' && (
              <button
                type="button"
                onClick={() => {
                  setRole('VEHICLE_REGISTRATION');
                  navigate('/dashboard/vehicle-registration-office');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Switch to MOTL & Issue Digital Libre</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 6-Stage Visual Stepper */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              End-to-End Import Lifecycle Progress
            </h3>
            <LifecycleStepper
              currentStage={shipment.currentStage}
              milestones={shipment.lifecycleMilestones}
            />
          </div>

          {/* Main Grid: Map & Vehicle Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    Live Transit Map
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    GPS Track: Lat {shipment.currentLocation?.latitude || shipment.currentLatitude}, Lng {shipment.currentLocation?.longitude || shipment.currentLongitude}
                  </span>
                </div>
                <CorridorMap
                  shipments={[shipment]}
                  focusedShipmentId={shipment.trackingNumber}
                  height="420px"
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <VehicleDossierCard shipment={shipment} />

              {/* Customs Assessment Summary Card */}
              {shipment.customsAssessment && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-emerald-400" />
                      Customs Clearance Assessment
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Channel: {shipment.customsAssessment.channel || 'GREEN'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Declaration No:</span>
                      <span className="text-white font-semibold">{shipment.customsAssessment.declarationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Assessed CIF:</span>
                      <span className="text-white">{shipment.customsAssessment.assessedCif?.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Total Duty & Tax:</span>
                      <span className="text-sky-300 font-bold">{shipment.customsAssessment.totalPayable?.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Payment Status:</span>
                      <span className="text-emerald-400 font-bold">{shipment.customsAssessment.paymentStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
