const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const desktopPath = "C:\\Users\\Ethio\\OneDrive\\Desktop";

// 1. Generate Commercial Invoice PDF
function generateInvoice() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const outPath = path.join(desktopPath, 'Toyota_Commercial_Invoice_INV2026.pdf');
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // Header
  doc.rect(40, 40, 515, 60).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('TOYOTA TSUSHO CORPORATION', 55, 52);
  doc.fontSize(9).font('Helvetica').text('Middle East & Africa Division • JAFZA South, Dubai, UAE', 55, 72);
  doc.fontSize(11).font('Helvetica-Bold').text('COMMERCIAL INVOICE', 390, 52, { align: 'right', width: 150 });
  doc.fontSize(8).font('Helvetica').text('Ref: INV-2026-TTC-8940', 390, 72, { align: 'right', width: 150 });

  doc.moveDown(3);
  doc.fillColor('#0f172a');

  // Parties Box
  const yParties = 115;
  doc.rect(40, yParties, 250, 75).strokeColor('#cbd5e1').stroke();
  doc.rect(305, yParties, 250, 75).strokeColor('#cbd5e1').stroke();

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#0284c7').text('EXPORTER / SHIPPER:', 50, yParties + 8);
  doc.font('Helvetica').fillColor('#334155').fontSize(8).text(
    'Toyota Tsusho Middle East FZE\nJAFZA South Zone 2, P.O. Box 17291\nDubai, United Arab Emirates\nTel: +971 4 883 8920',
    50, yParties + 22
  );

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#0284c7').text('CONSIGNEE (ETHIOPIA):', 315, yParties + 8);
  doc.font('Helvetica').fillColor('#334155').fontSize(8).text(
    'Ethio Auto Imports PLC\nBole Sub-City, Kebele 04, House 912\nAddis Ababa, Ethiopia\nTIN: 0098471203 | L/C: CBE-LC-2026-8941',
    315, yParties + 22
  );

  // Shipment Details Grid
  const yShip = 205;
  doc.rect(40, yShip, 515, 55).strokeColor('#cbd5e1').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
  doc.text('PORT OF LOADING:', 50, yShip + 8);
  doc.text('PORT OF DISCHARGE:', 180, yShip + 8);
  doc.text('FINAL DESTINATION:', 310, yShip + 8);
  doc.text('INVOICE DATE:', 440, yShip + 8);

  doc.font('Helvetica').fillColor('#0f172a');
  doc.text('Jebel Ali (AEJEA)', 50, yShip + 22);
  doc.text('Port of Djibouti (DJJIB)', 180, yShip + 22);
  doc.text('Modjo Dry Port (ETMOD)', 310, yShip + 22);
  doc.text('12-JAN-2026', 440, yShip + 22);

  // Items Table Header
  const yTable = 275;
  doc.rect(40, yTable, 515, 20).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
  doc.text('ITEM', 50, yTable + 6);
  doc.text('DESCRIPTION & SPECIFICATIONS', 85, yTable + 6);
  doc.text('CHASSIS / VIN', 280, yTable + 6);
  doc.text('CC', 410, yTable + 6);
  doc.text('TOTAL (USD)', 470, yTable + 6, { width: 75, align: 'right' });

  // Table Row
  const yRow = yTable + 25;
  doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
  doc.text('01', 50, yRow);
  doc.text('TOYOTA LAND CRUISER PRADO TX\nYear: 2024 | Hybrid Electric\nColor: Pearl White Mica', 85, yRow);
  doc.font('Helvetica-Bold').text('JTJHY7AX8N4029182', 280, yRow);
  doc.font('Helvetica').text('2,755 cc', 410, yRow);
  doc.font('Helvetica-Bold').text('$24,500.00', 470, yRow, { width: 75, align: 'right' });

  // Line
  doc.moveTo(40, yRow + 40).lineTo(555, yRow + 40).strokeColor('#e2e8f0').stroke();

  // Price breakdown box
  const yTotals = yRow + 50;
  doc.font('Helvetica').fontSize(8).fillColor('#475569');
  doc.text('FOB Jebel Ali Value:', 350, yTotals);
  doc.text('Ocean Freight (Djibouti):', 350, yTotals + 15);
  doc.text('Marine Insurance (110%):', 350, yTotals + 30);
  doc.font('Helvetica-Bold').fillColor('#0f172a').text('TOTAL CIF DJIBOUTI (USD):', 330, yTotals + 48);
  doc.font('Helvetica-Bold').fillColor('#0284c7').text('TOTAL CIF (ETB @ CBE 125.5):', 320, yTotals + 65);

  doc.font('Helvetica').fillColor('#0f172a');
  doc.text('$24,500.00', 470, yTotals, { width: 75, align: 'right' });
  doc.text('$2,200.00', 470, yTotals + 15, { width: 75, align: 'right' });
  doc.text('$800.00', 470, yTotals + 30, { width: 75, align: 'right' });
  doc.font('Helvetica-Bold').text('$27,500.00', 470, yTotals + 48, { width: 75, align: 'right' });
  doc.font('Helvetica-Bold').fillColor('#0284c7').text('ETB 3,451,250.00', 470, yTotals + 65, { width: 75, align: 'right' });

  // Declaration & Stamp
  const yStamp = 470;
  doc.rect(40, yStamp, 515, 65).strokeColor('#cbd5e1').stroke();
  doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(
    'DECLARATION: We hereby certify that this invoice is true and correct, that the prices stated are real commercial prices, and that the country of manufacture of the vehicle is JAPAN. This invoice is issued for Ethiopian Customs Commission entry.',
    50, yStamp + 8, { width: 495 }
  );

  doc.rect(400, yStamp + 28, 140, 30).strokeColor('#0284c7').stroke();
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#0284c7').text('CERTIFIED COMMERCIAL COPY\nTOYOTA TSUSHO EXPORT STAMP', 405, yStamp + 34, { align: 'center', width: 130 });

  doc.end();
  return outPath;
}

// 2. Generate Bill of Lading PDF
function generateBOL() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const outPath = path.join(desktopPath, 'Horn_Maritime_BOL_HML8492.pdf');
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // Header
  doc.rect(40, 40, 515, 60).fill('#0369a1');
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('HORN MARITIME LINES S.A.', 55, 52);
  doc.fontSize(9).font('Helvetica').text('Red Sea & East Africa Multimodal Ocean Carrier', 55, 72);
  doc.fontSize(11).font('Helvetica-Bold').text('BILL OF LADING (B/L)', 380, 52, { align: 'right', width: 160 });
  doc.fontSize(8).font('Helvetica').text('B/L No: HML-DXB-849201', 380, 72, { align: 'right', width: 160 });

  doc.moveDown(3);

  // Vessel Info Bar
  const yVessel = 115;
  doc.rect(40, yVessel, 515, 45).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
  doc.text('VESSEL & VOYAGE:', 50, yVessel + 8);
  doc.text('CONTAINER NO:', 180, yVessel + 8);
  doc.text('CUSTOMS SEAL NO:', 320, yVessel + 8);
  doc.text('GROSS WEIGHT:', 440, yVessel + 8);

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
  doc.text('MV Horn Pioneer / 09A', 50, yVessel + 22);
  doc.text('MSKU-948201-4', 180, yVessel + 22);
  doc.text('9F82A0 (Tamper Evident)', 320, yVessel + 22);
  doc.text('2,850 KG', 440, yVessel + 22);

  // Route Boxes
  const yRoute = 175;
  doc.rect(40, yRoute, 250, 60).strokeColor('#cbd5e1').stroke();
  doc.rect(305, yRoute, 250, 60).strokeColor('#cbd5e1').stroke();

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#0369a1').text('PORT OF LOADING & DISCHARGE', 50, yRoute + 8);
  doc.font('Helvetica').fontSize(8).fillColor('#334155').text(
    'Loading Port: Jebel Ali (AEJEA)\nDischarge Port: Port of Djibouti (DJJIB)\nTransit: Red Sea Coastal Corridor',
    50, yRoute + 22
  );

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#0369a1').text('INLAND MULTIMODAL DESTINATION', 315, yRoute + 8);
  doc.font('Helvetica').fontSize(8).fillColor('#334155').text(
    'Place of Delivery: Modjo Dry Port (ETMOD)\nTransit Operator: Trans-Ethiopia Logistics\nDestination: Addis Ababa, Ethiopia',
    315, yRoute + 22
  );

  // Cargo description
  const yCargo = 250;
  doc.rect(40, yCargo, 515, 120).strokeColor('#cbd5e1').stroke();
  doc.rect(40, yCargo, 515, 20).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text('PARTICULARS FURNISHED BY SHIPPER - SAID TO CONTAIN', 50, yCargo + 6);

  doc.font('Helvetica').fontSize(8).fillColor('#1e293b').text(
    '1 x 40FT HIGH CUBE CONTAINER (MSKU-948201-4)\nSAID TO CONTAIN:\n' +
    '• 1 UNIT MOTOR VEHICLE: 2024 TOYOTA LAND CRUISER PRADO TX\n' +
    '• CHASSIS VIN: JTJHY7AX8N4029182\n' +
    '• ENGINE DISPLACEMENT: 2,755 CC | FUEL: HYBRID\n' +
    '• FREIGHT PREPAID • SHIPPED ON BOARD CLEAN\n' +
    '• NOTIFY PARTY: ETHIO AUTO IMPORTS PLC / TRANS-ETHIOPIA LOGISTICS',
    50, yCargo + 30, { lineGap: 3 }
  );

  doc.rect(400, 400, 140, 45).strokeColor('#0369a1').stroke();
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#0369a1').text('HORN MARITIME LINES\nMASTER OCEAN BILL OF LADING\nSIGNED & AUTHENTICATED', 405, 410, { align: 'center', width: 130 });

  doc.end();
  return outPath;
}

console.log('Invoice PDF generated at:', generateInvoice());
console.log('BOL PDF generated at:', generateBOL());