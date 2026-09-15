import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ExportButtons } from './ExportButtons';

export interface FilterConfig {
  searchPlaceholder?: string;
  stageFilter?: boolean;
  channelFilter?: boolean;
  portFilter?: boolean;
  ports?: string[];
  stages?: { value: string; label: string }[];
}

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStage?: string;
  onStageChange?: (stage: string) => void;
  selectedChannel?: string;
  onChannelChange?: (channel: string) => void;
  selectedPort?: string;
  onPortChange?: (port: string) => void;
  config?: FilterConfig;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  totalCount?: number;
  filteredCount?: number;
}

const DEFAULT_STAGES = [
  { value: 'ALL', label: 'All Stages' },
  { value: 'PRE_IMPORT', label: 'Pre-Import' },
  { value: 'SHIPPING', label: 'Sea Shipping' },
  { value: 'PORT_OPERATIONS', label: 'Port Operations' },
  { value: 'CUSTOMS', label: 'Customs Clearance' },
  { value: 'POST_CUSTOMS', label: 'Corridor Transit' },
  { value: 'DELIVERY', label: 'MOTL Delivery' },
];

const DEFAULT_PORTS = ['ALL', 'Port of Djibouti', 'Port of Berbera', 'Modjo Dry Port', 'Kality Depot'];

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedStage = 'ALL',
  onStageChange,
  selectedChannel = 'ALL',
  onChannelChange,
  selectedPort = 'ALL',
  onPortChange,
  config = {},
  onExportCsv,
  onExportPdf,
  totalCount,
  filteredCount,
}) => {
  const stages = config.stages || DEFAULT_STAGES;
  const ports = config.ports || DEFAULT_PORTS;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedStage !== 'ALL' ||
    selectedChannel !== 'ALL' ||
    selectedPort !== 'ALL';

  const clearFilters = () => {
    onSearchChange('');
    if (onStageChange) onStageChange('ALL');
    if (onChannelChange) onChannelChange('ALL');
    if (onPortChange) onPortChange('ALL');
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 space-y-3 no-print shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={config.searchPlaceholder || 'Search by tracking #, VIN, vehicle...'}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action / Export Buttons */}
        <div className="flex items-center gap-2">
          {totalCount !== undefined && filteredCount !== undefined && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Showing <strong className="text-slate-900 dark:text-white">{filteredCount}</strong> of {totalCount}
            </span>
          )}
          <ExportButtons onExportCsv={onExportCsv} onExportPdf={onExportPdf} />
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Stage Filter */}
        {config.stageFilter !== false && onStageChange && (
          <select
            value={selectedStage}
            onChange={(e) => onStageChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-brand-500"
          >
            {stages.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        )}

        {/* Customs Channel Filter */}
        {config.channelFilter && onChannelChange && (
          <select
            value={selectedChannel}
            onChange={(e) => onChannelChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Channels</option>
            <option value="GREEN">🟢 Green (Immediate)</option>
            <option value="YELLOW">🟡 Yellow (Doc Audit)</option>
            <option value="RED">🔴 Red (Physical Scan)</option>
          </select>
        )}

        {/* Port Filter */}
        {config.portFilter && onPortChange && (
          <select
            value={selectedPort}
            onChange={(e) => onPortChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-brand-500"
          >
            {ports.map((p) => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'All Port Terminals' : p}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto text-xs font-medium"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
