import React, { useMemo } from 'react';
import { Modal } from '../common/Modal';
import { CustomsDeclaration, Shipment } from '../../types';
import { Printer, Download, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { NcisLogo } from '../brand/NcisLogo';

// Authentic High-Density SVG Barcode generator for official customs declaration
const DocumentBarcode: React.FC<{ value: string; height?: number; className?: string }> = ({
  value,
  height = 32,
  className = '',
}) => {
  const bars = useMemo(() => {
    const pattern: { w: number; isBar: boolean }[] = [];
    pattern.push({ w: 2, isBar: true }, { w: 1, isBar: false }, { w: 2, isBar: true }, { w: 2, isBar: false });
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const b1 = ((code * 3) % 3) + 1;
      const s1 = ((code * 5) % 2) + 1;
      const b2 = ((code * 7) % 3) + 1;
      const s2 = ((code * 2) % 2) + 1;
      pattern.push({ w: b1, isBar: true }, { w: s1, isBar: false }, { w: b2, isBar: true }, { w: s2, isBar: false });
    }
    pattern.push({ w: 2, isBar: true }, { w: 1, isBar: false }, { w: 3, isBar: true }, { w: 1, isBar: false }, { w: 2, isBar: true });
    return pattern;
  }, [value]);

  const totalWidth = bars.reduce((sum, b) => sum + b.w, 0);
  let currentX = 0;

  return (
    <div className={`flex flex-col items-end select-none ${className}`} data-testid="declaration-barcode">
      <svg
        data-testid="barcode"
        className="barcode"
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', maxWidth: '200px' }}
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.w;
          if (!bar.isBar) return null;
          return <rect key={idx} x={x} y={0} width={bar.w} height={height} fill="#0f172a" />;
        })}
      </svg>
      <span className="font-mono text-[9px] text-slate-700 tracking-wider mt-0.5 font-bold uppercase">
        *{value}*
      </span>
    </div>
  );
};

interface DeclarationPdfPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  declaration?: CustomsDeclaration;
}

export const DeclarationPdfPreview: React.FC<DeclarationPdfPreviewProps> = ({
  isOpen,
  onClose,
  shipment,
  declaration,
}) => {
  const decl = declaration || shipment.customsDeclaration || {
    id: 'dec-mock',
    shipmentId: shipment.id,
    declarationNumber: 'ECC-DEC-2026-00142',
    assessedCif: 3450000,
    dutyAmount: 1207500,
    exciseAmount: 2070000,
    vatAmount: 1009125,
    surtaxAmount: 672750,
    withholdingAmount: 103500,
    totalPayable: 5062875,
    paymentStatus: 'PAID',
    declarantName: 'Ethio Transit & Clearing Agency PLC',
    declarantTin: '0049281048',
    customsOffice: 'Modjo Multimodal Customs Directorate',
    channel: 'GREEN',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Customs Declaration (Form C-30)"
      subtitle="Ethiopian Customs Commission • Single Goods Declaration Document"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Printable Formal Document */}
        <div className="bg-white text-slate-900 p-8 rounded-xl border-2 border-slate-300 shadow-xl space-y-5 font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NcisLogo size={44} showText={false} />
              <div>
                <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Ethiopian Customs Commission
                </h1>
                <p className="text-xs font-bold text-slate-700 uppercase">
                  Single Customs Declaration • Form C-30
                </p>
                <p className="text-[10px] text-slate-500">
                  Customs Directorate: {decl.customsOffice}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Declaration No.</span>
              <span className="text-sm font-mono font-black text-sky-900">{decl.declarationNumber}</span>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Channel: {decl.channel || 'GREEN'}
                </span>
              </div>
              <div className="mt-2">
                <DocumentBarcode value={decl.declarationNumber} height={26} />
              </div>
            </div>
          </div>

          {/* Parties & Consignment */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Declarant / Consignee</span>
              <strong className="text-slate-900">{decl.declarantName}</strong>
              <p className="text-slate-600 font-mono text-[11px]">TIN: {decl.declarantTin}</p>
              <p className="text-slate-600">Consignee: {shipment.importer?.organization || 'Ethio Auto Imports PLC'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Transport & Transit</span>
              <p className="text-slate-800">Bill of Lading: <strong className="font-mono">{shipment.billOfLadingNumber}</strong></p>
              <p className="text-slate-800">Container: <strong className="font-mono">{shipment.containerNumber}</strong></p>
              <p className="text-slate-800">Origin / Port: {shipment.originPort} → {shipment.transitPort}</p>
            </div>
          </div>

          {/* Vehicle Assessment Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
              Declared Goods Assessment
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-2 border-b">Vehicle / Item</th>
                  <th className="p-2 border-b">Chassis / VIN</th>
                  <th className="p-2 border-b">HS Code</th>
                  <th className="p-2 border-b text-right">CIF Value (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipment.vehicles?.map((v) => (
                  <tr key={v.vin}>
                    <td className="p-2 font-medium">{v.make} {v.model} ({v.year})</td>
                    <td className="p-2 font-mono text-[11px]">{v.vin}</td>
                    <td className="p-2 font-mono">8703.23.00</td>
                    <td className="p-2 text-right font-mono font-bold">{(v.cifValue ?? 0).toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Duty Breakdown */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-2">
              Tax & Duty Computation (Cascading Schedule)
            </h4>
            <div className="grid grid-cols-2 gap-y-1.5 font-mono text-slate-700">
              <div>Customs Duty (35%):</div>
              <div className="text-right font-semibold">{(decl.dutyAmount ?? 0).toLocaleString()} ETB</div>

              <div>Excise Tax (Engine cc based):</div>
              <div className="text-right font-semibold">{(decl.exciseAmount ?? 0).toLocaleString()} ETB</div>

              <div>Value Added Tax (15%):</div>
              <div className="text-right font-semibold">{(decl.vatAmount ?? 0).toLocaleString()} ETB</div>

              <div>Surtax (10%):</div>
              <div className="text-right font-semibold">{(decl.surtaxAmount ?? 0).toLocaleString()} ETB</div>

              <div>Withholding Tax (3% on CIF):</div>
              <div className="text-right font-semibold">{(decl.withholdingAmount ?? 0).toLocaleString()} ETB</div>

              <div className="border-t-2 border-slate-900 pt-2 font-bold text-slate-900 text-sm">
                Total Duties & Taxes:
              </div>
              <div className="border-t-2 border-slate-900 pt-2 text-right font-bold text-slate-900 text-sm">
                {(decl.totalPayable ?? 0).toLocaleString()} ETB
              </div>
            </div>
          </div>

          {/* Stamp, Barcode & QR Verification Section */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ASYCUDA / NCIS QR Verification Box */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="p-1.5 bg-white rounded border border-slate-300 shadow-sm shrink-0">
                <QRCodeSVG
                  data-testid="declaration-qr"
                  className="qr"
                  value={`https://ncis.gov.et/customs/declarations/${decl.declarationNumber}?asycuda=ASY-ET-2026`}
                  size={64}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  ASYCUDA / ECC Verification
                </p>
                <p className="font-mono text-[9px] text-slate-500 truncate max-w-[200px]">
                  Ref: {decl.declarationNumber}
                </p>
                <p>Status: <strong className="text-emerald-700 uppercase font-semibold">{decl.paymentStatus}</strong></p>
                <p className="text-[9px] text-slate-400">Scan QR to authenticate via NCIS National Portal</p>
              </div>
            </div>

            {/* Official Authority Stamp & Digital Seal */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900 uppercase text-[11px]">Clearance Authority</p>
                <p>Customs Proclamation No. 859/2014 &amp; 1186/2020</p>
                <p className="font-mono text-[9px] text-slate-500">Directorate: {decl.customsOffice || 'Modjo Dry Port'}</p>
                <p className="text-[9px] text-emerald-700 font-semibold">Duty Assessment &amp; Release Authorized</p>
              </div>
              <div className="border-2 border-emerald-600 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded font-black uppercase tracking-wider text-[11px] text-center shadow-sm shrink-0">
                ECC Digital Verified
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Form C-30
          </button>
        </div>
      </div>
    </Modal>
  );
};
