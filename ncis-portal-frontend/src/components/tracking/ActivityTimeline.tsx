import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, MapPin, FileText, User } from 'lucide-react';
import { TimelineMilestone, MOCK_TIMELINE_EVENTS } from '../../services/timelineData';

interface ActivityTimelineProps {
  trackingNumber?: string;
  events?: TimelineMilestone[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  trackingNumber = 'ET-SHP-2026-001',
  events
}) => {
  const timeline = events || MOCK_TIMELINE_EVENTS[trackingNumber] || MOCK_TIMELINE_EVENTS['ET-SHP-2026-001'];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Consignment Chain-of-Custody Activity Feed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable SHA-256 multi-agency event log for <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{trackingNumber}</span>
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          Cryptographically Verified
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {timeline.map((event, idx) => {
          const isDone = event.status === 'COMPLETED';
          const isCurrent = event.status === 'IN_PROGRESS';
          const isPending = event.status === 'PENDING';

          return (
            <div key={event.id || idx} className="relative group">
              {/* Status node icon */}
              <div
                className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-900'
                    : isCurrent
                    ? 'bg-brand-600 text-white animate-pulse ring-4 ring-brand-100 dark:ring-brand-950'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 ring-4 ring-white dark:ring-slate-900'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>

              {/* Event Card */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 rounded-xl p-4 card-hover-lift">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {event.title}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : isCurrent
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {event.stage}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                      {event.timestamp}
                    </span>
                    <span className="text-[10px] text-slate-400 font-serif block">
                      {event.ethiopianDate}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  {event.description}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <strong>{event.actor}</strong> ({event.actorRole})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {event.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {event.documents && event.documents.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[10px] font-medium">
                        <FileText className="w-2.5 h-2.5" />
                        {event.documents.length} doc{event.documents.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                      SHA: {event.blockHash}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
