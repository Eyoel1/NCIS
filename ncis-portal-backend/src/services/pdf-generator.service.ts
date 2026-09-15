import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface FormC30Data {
  declarationNumber: string;
  asycudaReference?: string;
  assessmentDate?: string;
  customsStation?: string;
  channel?: string; // GREEN, YELLOW, RED
  declarantName?: string;
  declarantTin?: string;
  importerName?: string;
  importerTin?: string;
  supplierName?: string;
  portOfLoading?: string;
  vesselName?: string;
  billOfLadingNumber?: string;
  containerNumber?: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  engineCc: number;
  fuelType: string;
  color?: string;
  cifUsd: number;
  cifEtb: number;
  exchangeRate: number;
  hsCode?: string;
  dutyAmount: number;
  dutyRatePercent: number;
  exciseAmount: number;
  exciseRatePercent: number;
  vatAmount: number;
  vatRatePercent: number;
  surtaxAmount: number;
  surtaxRatePercent: number;
  withholdingAmount: number;
  withholdingRatePercent: number;
  totalPayable: number;
  paymentStatus?: string;
  paymentReference?: string;
}

export class FormC30PdfGenerator {
  public static async generate(data: FormC30Data): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36,
          info: {
            Title: `ECC Form C-30 - ${data.declarationNumber}`,
            Author: 'Ethiopian Customs Commission (ECC)',
            Subject: 'Customs Import Declaration & Assessment Notice',
            Keywords: 'Ethiopia, Customs, Tax, ASYCUDA, Form C-30',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const pageWidth = doc.page.width;
        const margin = 36;
        const contentWidth = pageWidth - margin * 2;

        // --- TOP HEADER ---
        doc
          .rect(margin, margin, contentWidth, 52)
          .fillAndStroke('#0f172a', '#0f172a');

        doc
          .fillColor('#ffffff')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(
            'FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA - ETHIOPIAN CUSTOMS COMMISSION (ECC)',
            margin,
            margin + 10,
            { align: 'center', width: contentWidth }
          );

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(
            'CUSTOMS IMPORT DECLARATION & OFFICIAL TAX ASSESSMENT NOTICE (FORM C-30)',
            margin,
            margin + 26,
            { align: 'center', width: contentWidth }
          );

        doc
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(
            'Pursuant to Customs Proclamation No. 859/2014 & Excise Proclamation No. 1186/2020',
            margin,
            margin + 38,
            { align: 'center', width: contentWidth }
          );

        let y = margin + 58;

        // --- DECLARATION KEY METADATA BAR ---
        doc.rect(margin, y, contentWidth, 42).fillAndStroke('#f1f5f9', '#cbd5e1');

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
        doc.text('DECLARATION NO:', margin + 8, y + 6);
        doc.font('Helvetica').text(data.declarationNumber, margin + 100, y + 6);

        doc.font('Helvetica-Bold').text('ASYCUDA REG NO:', margin + 280, y + 6);
        doc.font('Helvetica').text(data.asycudaReference || 'ASY-MODJO-2026-R-91823', margin + 375, y + 6);

        doc.font('Helvetica-Bold').text('DATE OF ASSESSMENT:', margin + 8, y + 22);
        doc.font('Helvetica').text(data.assessmentDate || new Date().toISOString().split('T')[0], margin + 115, y + 22);

        doc.font('Helvetica-Bold').text('CUSTOMS STATION:', margin + 280, y + 22);
        doc.font('Helvetica').text(data.customsStation || 'ET-010 MODJO DRY PORT', margin + 375, y + 22);

        // Channel Badge
        const channel = data.channel || 'YELLOW';
        const channelColor =
          channel === 'GREEN' ? '#16a34a' : channel === 'RED' ? '#dc2626' : '#d97706';
        doc.rect(contentWidth - 40, y + 8, 65, 24).fill(channelColor);
        doc
          .fillColor('#ffffff')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(`[ ${channel} ]`, contentWidth - 40, y + 15, { width: 65, align: 'center' });

        y += 48;

        // --- SECTION A & B: PARTIES ---
        const colWidth = (contentWidth - 10) / 2;
        doc.rect(margin, y, colWidth, 68).stroke('#cbd5e1');
        doc.rect(margin + colWidth + 10, y, colWidth, 68).stroke('#cbd5e1');

        // Consignee
        doc
          .rect(margin, y, colWidth, 16)
          .fill('#e2e8f0')
          .fillColor('#0f172a')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('SECTION A: IMPORTER / CONSIGNEE', margin + 6, y + 4);

        doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
        doc.text(`Name: ${data.importerName || 'Ethio-Red Sea Motors PLC'}`, margin + 6, y + 20);
        doc.text(`TIN: ${data.importerTin || '0019482716'} | Declarant TIN: ${data.declarantTin || '0048192031'}`, margin + 6, y + 34);
        doc.text(`Address: Kirkos Sub-City, Addis Ababa, Ethiopia`, margin + 6, y + 48);

        // Supplier
        doc
          .rect(margin + colWidth + 10, y, colWidth, 16)
          .fill('#e2e8f0')
          .fillColor('#0f172a')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('SECTION B: SUPPLIER / EXPORTER', margin + colWidth + 16, y + 4);

        doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
        doc.text(`Supplier: ${data.supplierName || 'Toyota Tsusho Corporation ME'}`, margin + colWidth + 16, y + 20);
        doc.text(`Port of Loading: ${data.portOfLoading || 'Jebel Ali Port, Dubai'}`, margin + colWidth + 16, y + 34);
        doc.text(`Origin Country: United Arab Emirates / Japan`, margin + colWidth + 16, y + 48);

        y += 74;

        // --- SECTION C: TRANSPORT & LOGISTICS ---
        doc.rect(margin, y, contentWidth, 38).stroke('#cbd5e1');
        doc
          .rect(margin, y, contentWidth, 14)
          .fill('#e2e8f0')
          .fillColor('#0f172a')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('SECTION C: TRANSPORT, SHIPPING & MANIFEST', margin + 6, y + 3);

        doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
        doc.text(`B/L Number: ${data.billOfLadingNumber || 'MSK2026881902'}`, margin + 6, y + 18);
        doc.text(`Vessel: ${data.vesselName || 'M/V Shebelle'}`, margin + 180, y + 18);
        doc.text(`Container: ${data.containerNumber || 'MSKU-784910-2'}`, margin + 360, y + 18);

        y += 44;

        // --- SECTION D: VEHICLE TECHNICAL DATA ---
        doc.rect(margin, y, contentWidth, 54).stroke('#cbd5e1');
        doc
          .rect(margin, y, contentWidth, 14)
          .fill('#e2e8f0')
          .fillColor('#0f172a')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('SECTION D: VEHICLE TECHNICAL SPECIFICATION & IDENTIFICATION', margin + 6, y + 3);

        doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
        doc.text(`VIN / Chassis: ${data.vin}`, margin + 6, y + 18);
        doc.text(`Make & Model: ${data.make} ${data.model}`, margin + 220, y + 18);
        doc.text(`Model Year: ${data.year}`, margin + 420, y + 18);

        doc.text(`Engine Displacement: ${data.engineCc > 0 ? `${data.engineCc} cc` : '0 cc (Pure Electric)'}`, margin + 6, y + 34);
        doc.text(`Fuel Type: ${data.fuelType}`, margin + 220, y + 34);
        doc.text(`Color: ${data.color || 'Standard'}`, margin + 420, y + 34);

        y += 60;

        // --- SECTION E: VALUATION & TARIFF ASSESSMENT TABLE ---
        doc.rect(margin, y, contentWidth, 16).fill('#0f172a');
        doc
          .fillColor('#ffffff')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('SECTION E: CUSTOMS VALUATION & CASCADING DUTY ASSESSMENT', margin + 6, y + 4);

        doc
          .fillColor('#94a3b8')
          .fontSize(8)
          .text(
            `HS Code: ${data.hsCode || '8703.23.90'}  |  CIF (USD): $${data.cifUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}  |  FX Rate: ${data.exchangeRate.toFixed(2)} ETB/USD  |  CIF (ETB): ETB ${data.cifEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            margin + 200,
            y + 4
          );

        y += 18;

        // Table Header
        const tableHeaders = [
          { title: 'Tax Head / Description', x: margin + 6, width: 140 },
          { title: 'Legal Authority', x: margin + 150, width: 110 },
          { title: 'Base (ETB)', x: margin + 265, width: 95, align: 'right' },
          { title: 'Rate', x: margin + 365, width: 45, align: 'right' },
          { title: 'Amount (ETB)', x: margin + 415, width: 100, align: 'right' },
        ];

        doc.rect(margin, y, contentWidth, 18).fill('#e2e8f0');
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
        for (const th of tableHeaders) {
          doc.text(th.title, th.x, y + 5, { width: th.width, align: (th.align as any) || 'left' });
        }

        y += 18;

        const tableRows = [
          {
            name: 'Customs Duty (የጉምሩክ ቀረጥ)',
            law: 'Proclamation 859/2014',
            base: data.cifEtb,
            rate: `${data.dutyRatePercent.toFixed(1)}%`,
            amount: data.dutyAmount,
          },
          {
            name: 'Excise Tax (የኤክሳይዝ ታክስ)',
            law: 'Proclamation 1186/2020',
            base: data.cifEtb + data.dutyAmount,
            rate: `${data.exciseRatePercent.toFixed(1)}%`,
            amount: data.exciseAmount,
          },
          {
            name: 'Value Added Tax (ቫት)',
            law: 'Proclamation 285/2002',
            base: data.cifEtb + data.dutyAmount + data.exciseAmount,
            rate: `${data.vatRatePercent.toFixed(1)}%`,
            amount: data.vatAmount,
          },
          {
            name: 'Surtax (የሱር ታክስ)',
            law: 'Regulation 133/2007',
            base: data.cifEtb + data.dutyAmount + data.exciseAmount,
            rate: `${data.surtaxRatePercent.toFixed(1)}%`,
            amount: data.surtaxAmount,
          },
          {
            name: 'Withholding Tax (ቅድመ ግብር)',
            law: 'Proclamation 979/2016',
            base: data.cifEtb,
            rate: `${data.withholdingRatePercent.toFixed(1)}%`,
            amount: data.withholdingAmount,
          },
        ];

        doc.font('Helvetica').fontSize(8);
        for (let i = 0; i < tableRows.length; i++) {
          const row = tableRows[i];
          const rowY = y + i * 18;
          if (i % 2 === 1) {
            doc.rect(margin, rowY, contentWidth, 18).fill('#f8fafc');
          }
          doc.fillColor('#1e293b');
          doc.text(row.name, margin + 6, rowY + 5, { width: 140 });
          doc.text(row.law, margin + 150, rowY + 5, { width: 110 });
          doc.text(row.base.toLocaleString('en-US', { minimumFractionDigits: 2 }), margin + 265, rowY + 5, {
            width: 95,
            align: 'right',
          });
          doc.text(row.rate, margin + 365, rowY + 5, { width: 45, align: 'right' });
          doc.text(row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), margin + 415, rowY + 5, {
            width: 100,
            align: 'right',
          });
        }

        y += tableRows.length * 18;

        // Totals Row
        doc.rect(margin, y, contentWidth, 22).fill('#e2e8f0');
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
        doc.text('TOTAL PAYABLE DUTIES & TAXES:', margin + 6, y + 6);
        doc.text(
          `ETB ${data.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          margin + 365,
          y + 6,
          { width: 150, align: 'right' }
        );

        y += 24;

        // Landed Cost Row
        const totalLandedCost = data.cifEtb + data.totalPayable;
        doc.rect(margin, y, contentWidth, 20).fill('#f1f5f9');
        doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
        doc.text('TOTAL LANDED COST (CIF + ALL TAXES):', margin + 6, y + 5);
        doc.text(
          `ETB ${totalLandedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          margin + 365,
          y + 5,
          { width: 150, align: 'right' }
        );

        y += 28;

        // --- SECTION F: STAMP, SIGNATURE & QR VERIFICATION ---
        const footerColWidth = (contentWidth - 10) / 2;

        // Left box: Security & QR Code
        doc.rect(margin, y, footerColWidth, 115).stroke('#cbd5e1');
        doc
          .rect(margin, y, footerColWidth, 14)
          .fill('#e2e8f0')
          .fillColor('#0f172a')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('VERIFICATION & CRYPTOGRAPHIC PROOF', margin + 6, y + 3);

        const qrPayload = JSON.stringify({
          iss: 'NCIS-ETHIOPIAN-CUSTOMS',
          dec: data.declarationNumber,
          vin: data.vin,
          cifEtb: data.cifEtb,
          taxEtb: data.totalPayable,
          status: data.paymentStatus || 'PAID',
          url: `https://ncis.gov.et/track/${data.vin}?verify=true`,
        });

        const qrBuffer = await QRCode.toBuffer(qrPayload, {
          width: 70,
          margin: 1,
          errorCorrectionLevel: 'M',
        });

        doc.image(qrBuffer, margin + 8, y + 20, { width: 70, height: 70 });

        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#475569')
          .text('Scan with any mobile camera to verify genuine customs assessment & settlement.', margin + 86, y + 22, {
            width: footerColWidth - 94,
          });

        doc.text(`Payment Status: ${data.paymentStatus || 'PAID (CBE SETTLED)'}`, margin + 86, y + 52);
        doc.text(`Reference: ${data.paymentReference || 'CBE-TX-9941829'}`, margin + 86, y + 64);

        // Barcode simulation
        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(`||||| |||| || |||||| ||||| ||||| ${data.declarationNumber} |||||`, margin + 10, y + 98, {
            width: footerColWidth - 20,
            align: 'center',
          });

        // Right box: Official Authority Stamp
        const rightBoxX = margin + footerColWidth + 10;
        doc.rect(rightBoxX, y, footerColWidth, 115).stroke('#cbd5e1');
        doc
          .rect(rightBoxX, y, footerColWidth, 14)
          .fill('#e2e8f0')
          .fillColor('#0f172a')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('OFFICIAL CLEARANCE STAMP & SIGNATURE', rightBoxX + 6, y + 3);

        // Circular Stamp drawing
        const stampCenterX = rightBoxX + 70;
        const stampCenterY = y + 65;
        doc.circle(stampCenterX, stampCenterY, 36).lineWidth(2).stroke('#1e3a8a');
        doc.circle(stampCenterX, stampCenterY, 32).lineWidth(1).stroke('#1e3a8a');

        doc
          .fontSize(6)
          .fillColor('#1e3a8a')
          .font('Helvetica-Bold')
          .text('ETHIOPIAN CUSTOMS', stampCenterX - 30, stampCenterY - 22, { width: 60, align: 'center' });
        doc.text('MODJO DRY PORT', stampCenterX - 30, stampCenterY - 12, { width: 60, align: 'center' });
        doc.fontSize(7).text('ASSESSED', stampCenterX - 30, stampCenterY - 2, { width: 60, align: 'center' });
        doc.fontSize(6).text('DUTY SETTLED', stampCenterX - 30, stampCenterY + 8, { width: 60, align: 'center' });
        doc.text('OFFICER: 4891', stampCenterX - 30, stampCenterY + 18, { width: 60, align: 'center' });

        doc.fontSize(7).fillColor('#1e293b').font('Helvetica');
        doc.text('Chief Customs Valuation Assessor:', rightBoxX + 115, y + 26);
        doc.font('Helvetica-Bold').text('Hiwot Girma / Tesfaye H.', rightBoxX + 115, y + 38);
        doc.font('Helvetica').text('Station: Modjo Dry Port Branch', rightBoxX + 115, y + 50);
        doc.text('Electronic Seal: VERIFIED-ECC', rightBoxX + 115, y + 62);
        doc.text(`Timestamp: ${new Date().toISOString()}`, rightBoxX + 115, y + 74);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
