import React from 'react';
import { Download, Printer } from 'lucide-react';

interface ExportButtonsProps {
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  label?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportCsv,
  onExportPdf,
  label = 'Export'
}) => {
  return (
    <div className="flex items-center gap-1.5 no-print">
      {onExportCsv && (
        <button
          type="button"
          onClick={onExportCsv}
          title="Download as CSV spreadsheet"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-all shadow-sm active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>CSV</span>
        </button>
      )}
      {onExportPdf && (
        <button
          type="button"
          onClick={onExportPdf}
          title="Print or Save as PDF"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-all shadow-sm active:scale-95"
        >
          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>PDF</span>
        </button>
      )}
    </div>
  );
};
