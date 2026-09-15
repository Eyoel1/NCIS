import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Shipment } from '../types';
import { LifecycleStepper } from '../components/tracking/LifecycleStepper';
import { VehicleDossierCard } from '../components/tracking/VehicleDossierCard';
import { CorridorMap } from '../components/map/CorridorMap';
import { StatusBadge } from '../components/common/StatusBadge';
import { useTranslation } from '../context/LanguageContext';
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
} from 'lucide-react';

export const PublicTrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      try {
        const data = await api.trackPublic(id);
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
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVin.trim()) {
      navigate(`/track/${encodeURIComponent(searchVin.trim())}`);
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
