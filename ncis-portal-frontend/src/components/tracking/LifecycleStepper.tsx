import React from 'react';
import { ShipmentStage } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { Check, Clock, Anchor, Ship, FileCheck, Truck, ShieldCheck, Award } from 'lucide-react';

interface LifecycleStepperProps {
  currentStage: ShipmentStage;
  milestones?: Array<{
    stage: string;
    completed: boolean;
    inProgress: boolean;
    timestamp?: string | null;
  }>;
  onSelectStage?: (stage: ShipmentStage) => void;
}

const STAGES: Array<{ key: ShipmentStage; icon: any }> = [
  { key: 'PRE_IMPORT', icon: FileCheck },
  { key: 'SHIPPING', icon: Ship },
  { key: 'PORT_OPERATIONS', icon: Anchor },
  { key: 'CUSTOMS', icon: ShieldCheck },
  { key: 'POST_CUSTOMS', icon: Truck },
  { key: 'DELIVERY', icon: Award },
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
  currentStage,
  milestones,
  onSelectStage,
}) => {
  const { t } = useTranslation();

  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="w-full py-4 px-2" data-testid="lifecycle-stepper">
      <div className="relative flex items-center justify-between">
        {/* Continuous background progress line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-800 -z-0" />
        {/* Completed active progress line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-sky-500 via-emerald-500 to-teal-400 transition-all duration-500 -z-0"
          style={{ width: `${(Math.max(0, currentIndex) / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((s, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;
          const Icon = s.icon;
          const milestoneData = milestones?.find((m) => m.stage === s.key);

          let circleClass = 'bg-slate-900 border-slate-700 text-slate-500';
          if (isCompleted) {
            circleClass = 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950';
          } else if (isCurrent) {
            circleClass = 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-950 ring-4 ring-sky-500/20';
          }

          return (
            <div
              key={s.key}
              onClick={() => onSelectStage && onSelectStage(s.key)}
              className={`relative z-10 flex flex-col items-center group ${
                onSelectStage ? 'cursor-pointer' : ''
              }`}
            >
              {/* Pulse ring for active step */}
              {isCurrent && (
                <span className="absolute -top-1 -left-1 w-10 h-10 rounded-full bg-sky-400 animate-ping opacity-30 pointer-events-none" />
              )}

              {/* Step Circle */}
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${circleClass}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Stage label & timestamp */}
              <div className="hidden sm:flex flex-col items-center mt-2.5 text-center max-w-[110px]">
                <span
                  className={`text-[11px] font-semibold leading-tight transition-colors ${
                    isCurrent
                      ? 'text-sky-400 font-bold'
                      : isCompleted
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {t(`stages.${s.key}`, s.key.replace(/_/g, ' '))}
                </span>
                {milestoneData?.timestamp && (
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {new Date(milestoneData.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
