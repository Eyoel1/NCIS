import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';
import { UploadCloud, FileText, CheckCircle2, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFill?: (data: any) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onAutoFill,
}) => {
  const { t } = useTranslation();
  const [docType, setDocType] = useState<'INVOICE' | 'BOL'>('INVOICE');
  const [fileSelected, setFileSelected] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const handleSelectMockFile = (name: string) => {
    setFileSelected(name);
    setExtractedData(null);
  };

  const handleRunOcr = async () => {
    setIsScanning(true);
    try {
      const result = await api.runOcrScan(docType);
      setExtractedData(result.extractedData);
    } catch {
      // Ignore
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (extractedData && onAutoFill) {
      onAutoFill(extractedData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Upload & OCR Extraction"
      subtitle="AI-assisted automated parsing of Commercial Invoices & Bills of Lading"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Document Type Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDocType('INVOICE');
              setFileSelected(null);
              setExtractedData(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
              docType === 'INVOICE'
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Commercial Invoice
          </button>
          <button
            type="button"
            onClick={() => {
              setDocType('BOL');
              setFileSelected(null);
              setExtractedData(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
              docType === 'BOL'
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bill of Lading (B/L)
          </button>
        </div>

        {/* Upload Dropzone */}
        {!fileSelected ? (
          <div
            onClick={() =>
              handleSelectMockFile(
                docType === 'INVOICE'
                  ? 'Toyota_Commercial_Invoice_INV2026.pdf'
                  : 'Horn_Maritime_BOL_HML8492.pdf'
              )
            }
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500/70 bg-slate-50 dark:bg-slate-950/60 p-8 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <div className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-500 dark:text-sky-400 group-hover:scale-110 transition-transform mb-3 shadow-sm">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Click to browse or drop sample {docType === 'INVOICE' ? 'Invoice' : 'B/L'} document
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Supports PDF, PNG, TIFF up to 10MB (Simulated OCR ready)
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-sky-500 dark:text-sky-400" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{fileSelected}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Ready for OCR processing
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunOcr}
              disabled={isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning text...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{t('actions.runOcr', 'Run OCR Auto-Fill')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Extracted OCR Results Display */}
        {extractedData && (
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                Extracted Data Fields (98% Confidence)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono font-semibold">
                OCR PARSED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              {Object.entries(extractedData).map(([key, val]) => {
                const displayVal =
                  typeof val === 'object' && val !== null && 'value' in val ? (val as any).value : val;
                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60 shadow-xs"
                  >
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block uppercase font-medium">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-slate-900 dark:text-slate-200 font-semibold truncate block mt-0.5">
                      {String(displayVal ?? '')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                <span>{t('actions.autoFill', 'Transfer to Declaration Form')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
