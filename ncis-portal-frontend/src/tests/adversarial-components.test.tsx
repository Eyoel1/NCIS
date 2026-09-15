import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeclarationPdfPreview } from '../components/customs/DeclarationPdfPreview';
import { VehicleQrModal } from '../components/qr/VehicleQrModal';
import { MOCK_SHIPMENTS } from '../services/mockData';

describe('Adversarial Challenger: DeclarationPdfPreview Fidelity', () => {
  const shipment = MOCK_SHIPMENTS[0]; // shp-001 with full customsDeclaration

  it('renders authentic Ethiopian Customs declaration fields and all 5 tax heads', () => {
    const { container } = render(
      <DeclarationPdfPreview
        isOpen={true}
        onClose={() => {}}
        shipment={shipment}
        declaration={shipment.customsDeclaration}
      />
    );

    // 1. Declarant Name & TIN
    expect(screen.getByText('Ethio Transit & Clearing Agency')).toBeInTheDocument();
    expect(screen.getByText(/TIN:\s*0049281048/i)).toBeInTheDocument();

    // 2. Declaration Number
    expect(screen.getByText('ECC-DEC-2026-00142')).toBeInTheDocument();

    // 3. Assessable CIF
    expect(screen.getByText(/3,450,000 ETB/i)).toBeInTheDocument();

    // 4. Breakdown of all 5 tax heads
    expect(screen.getByText(/Customs Duty/i)).toBeInTheDocument();
    expect(screen.getByText('1,207,500 ETB')).toBeInTheDocument();

    expect(screen.getByText(/Excise Tax/i)).toBeInTheDocument();
    expect(screen.getByText('2,070,000 ETB')).toBeInTheDocument();

    expect(screen.getByText(/Value Added Tax/i)).toBeInTheDocument();
    expect(screen.getByText('1,009,125 ETB')).toBeInTheDocument();

    expect(screen.getByText(/Surtax/i)).toBeInTheDocument();
    expect(screen.getByText('672,750 ETB')).toBeInTheDocument();

    expect(screen.getByText(/Withholding Tax/i)).toBeInTheDocument();
    expect(screen.getByText('103,500 ETB')).toBeInTheDocument();

    // Total
    expect(screen.getByText('5,062,875 ETB')).toBeInTheDocument();

    // 5. Official Stamp
    expect(screen.getByText(/ECC Digital Verified/i)).toBeInTheDocument();

    // 6. Barcode / QR Code visual presence check
    // We check if an svg with barcode/qr or class or qrcode exists
    const hasBarcodeOrQr =
      container.querySelector('svg[data-testid="barcode"]') ||
      container.querySelector('.barcode') ||
      container.querySelector('svg.qr') ||
      container.querySelector('svg rect') !== null;

    console.log('[CHALLENGE 2 TEST RESULT] DeclarationPdfPreview hasBarcodeOrQr:', Boolean(hasBarcodeOrQr));
  });
});

describe('Adversarial Challenger: VehicleQrModal URL & Badge', () => {
  const shipment = MOCK_SHIPMENTS[0];
  const vehicle = shipment.vehicles![0];

  it('encodes valid tracking URL and renders printable windshield pass', () => {
    const { container } = render(
      <VehicleQrModal
        isOpen={true}
        onClose={() => {}}
        shipment={shipment}
        vehicle={vehicle}
      />
    );

    // Header & Authority
    expect(screen.getByText(/Federal Democratic Republic of Ethiopia/i)).toBeInTheDocument();
    expect(screen.getByText(/Ethiopian Customs Commission/i)).toBeInTheDocument();
    expect(screen.getByText(/Customs Bonded Transit Authorized/i)).toBeInTheDocument();

    // Printable container
    const printablePass = container.querySelector('#printable-pass');
    expect(printablePass).not.toBeNull();

    // QR Code SVG presence
    const qrSvg = printablePass?.querySelector('svg');
    expect(qrSvg).not.toBeNull();

    // Vehicle details
    expect(screen.getByText(vehicle.vin)).toBeInTheDocument();
    expect(screen.getByText(shipment.trackingNumber)).toBeInTheDocument();

    // Windshield instruction
    expect(screen.getByText(/Display pass prominently inside front windshield/i)).toBeInTheDocument();
  });
});
