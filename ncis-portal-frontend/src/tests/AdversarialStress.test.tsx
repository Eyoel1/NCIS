import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth, DEMO_USERS } from '../context/AuthContext';
import { LanguageProvider, useTranslation } from '../context/LanguageContext';
import { enTranslations } from '../locales/en';
import { amTranslations } from '../locales/am';
import { computeEthiopianCustomsDuty, api } from '../services/api';
import { UserRole, Shipment } from '../types';

// Mock Leaflet CorridorMap for headless JSDOM testing
vi.mock('../components/map/CorridorMap', () => ({
  CorridorMap: ({ shipments, focusedShipmentId }: any) => (
    <div data-testid="mocked-corridor-map" data-shipment-count={shipments?.length}>
      Map Rendered: {focusedShipmentId || 'Overview'}
    </div>
  ),
}));

// Mock Recharts ResponsiveContainer to provide layout dimensions in JSDOM
vi.mock('recharts', async () => {
  const actual: any = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 400 }} data-testid="responsive-container">
        {children}
      </div>
    ),
  };
});

// Components to test
import { LandingPage } from '../pages/LandingPage';
import { PublicTrackerPage } from '../pages/PublicTrackerPage';
import { TransparencyStatsPage } from '../pages/TransparencyStatsPage';
import { Header } from '../components/common/Header';
import { VehicleDossierCard } from '../components/tracking/VehicleDossierCard';

// 8 Stakeholder Dashboards
import { SuperAdminDashboard } from '../pages/dashboards/SuperAdminDashboard';
import { ImporterDashboard } from '../pages/dashboards/ImporterDashboard';
import { ShippingDashboard } from '../pages/dashboards/ShippingDashboard';
import { PortOperatorDashboard } from '../pages/dashboards/PortOperatorDashboard';
import { CustomsDashboard } from '../pages/dashboards/CustomsDashboard';
import { TransportDashboard } from '../pages/dashboards/TransportDashboard';
import { FinanceDashboard } from '../pages/dashboards/FinanceDashboard';
import { RegistrationDashboard } from '../pages/dashboards/RegistrationDashboard';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
}

describe('NCIS Portal — Adversarial Stress & Robustness Probing', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. UNAUTHENTICATED PUBLIC ACCESS ADVERSARIAL TESTING
  // =========================================================================
  describe('Adversarial Test 1: Unauthenticated Public Routes', () => {
    it('renders LandingPage (/) without session, token, or user object without throwing', async () => {
      // Force null token and user in storage
      localStorage.setItem('ncis_token', '');
      localStorage.removeItem('ncis_user');

      render(
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/']}>
                <Header />
                <LandingPage />
              </MemoryRouter>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      );

      // Verify Header and Sovereign Brand element render
      const sovereignMentions = screen.getAllByText(/Federal Democratic Republic of Ethiopia/i);
      expect(sovereignMentions.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Single-Window Transparency/i)).toBeInTheDocument();

      // Verify search form is present
      const searchInput = screen.getByPlaceholderText(/Enter Chassis VIN or Tracking Number/i);
      expect(searchInput).toBeInTheDocument();

      // Verify National Metrics Ticker Bar renders
      expect(screen.getByText(/14,820\+/i)).toBeInTheDocument();
      expect(screen.getByText(/Djibouti vs Berbera Throughput/i)).toBeInTheDocument();

      // Verify GIS Map container renders
      expect(screen.getByTestId('mocked-corridor-map')).toBeInTheDocument();

      // Verify all 8 stakeholder portal launch cards are visible on landing page
      expect(screen.getAllByText(/SUPER ADMIN/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/IMPORTER SUPPLIER/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/SHIPPING COMPANY/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/PORT OPERATOR/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/CUSTOMS AUTHORITY/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/TRANSPORT FORWARDER/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/FINANCIAL INSURANCE/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/VEHICLE REGISTRATION/i).length).toBeGreaterThanOrEqual(1);
    });

    it('VERIFIES REMEDIATION: api.trackPublic maps cifValue & engineCc and VehicleDossierCard renders cleanly without throwing', async () => {
      // Step 1: Call api.trackPublic directly with valid tracking number
      const publicData = await api.trackPublic('ET-SHP-2026-001');

      expect(publicData.trackingNumber).toBe('ET-SHP-2026-001');
      expect(publicData.vehicles).toBeDefined();
      expect(publicData.vehicles.length).toBeGreaterThan(0);

      const firstVehicle = publicData.vehicles[0];
      // cifValue and engineCc are properly mapped onto the public vehicle object
      expect(firstVehicle.cifValue).toBeDefined();
      expect(firstVehicle.cifValue).toBe(3450000);
      expect(firstVehicle.engineCc).toBeDefined();

      // Step 2: Render VehicleDossierCard with this shipment and verify it renders without errors
      let caughtError: any = null;
      try {
        render(
          <LanguageProvider>
            <VehicleDossierCard shipment={publicData as Shipment} />
          </LanguageProvider>
        );
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).toBeNull();
      expect(screen.getByText(/3,450,000 ETB/i)).toBeInTheDocument();

      // Step 3: Defensively test when cifValue and engineCc are undefined - no crash occurs
      const unmappedShipment = {
        ...publicData,
        id: 'shp-unmapped',
        vehicles: [
          {
            vin: 'VIN-NO-CIF',
            make: 'Toyota',
            model: 'Land Cruiser',
            year: 2025,
            cifValue: undefined as any,
            engineCc: undefined as any,
          },
        ],
      };
      let unmappedError: any = null;
      try {
        render(
          <LanguageProvider>
            <VehicleDossierCard shipment={unmappedShipment as any} />
          </LanguageProvider>
        );
      } catch (err: any) {
        unmappedError = err;
      }
      expect(unmappedError).toBeNull();
      expect(screen.getByText('0 ETB')).toBeInTheDocument();
      expect(screen.getByText('0 cc')).toBeInTheDocument();
    });

    it('handles non-existent tracking ID gracefully with user-friendly error card', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/track/NON-EXISTENT-TRACKING-XYZ']}>
                <Routes>
                  <Route path="/track/:id" element={<PublicTrackerPage />} />
                </Routes>
              </MemoryRouter>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      );

      const heading = await screen.findByRole('heading', { name: /No Shipment Found/i }, { timeout: 6000 });
      expect(heading).toBeInTheDocument();

      expect(screen.getByText(/No shipment found matching tracking\/VIN/i)).toBeInTheDocument();
      expect(screen.getByText(/Load Sample Dossier: ET-SHP-2026-001/i)).toBeInTheDocument();
    });

    it('renders TransparencyStatsPage (/statistics) completely without authentication', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/statistics']}>
                <TransparencyStatsPage />
              </MemoryRouter>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      );

      // Verify KPI Metrics
      expect(screen.getByText(/Total Cleared Units/i)).toBeInTheDocument();
      expect(screen.getByText('14,825')).toBeInTheDocument();
      expect(screen.getByText(/Duty Revenue Assessed/i)).toBeInTheDocument();
      expect(screen.getByText('8.95B')).toBeInTheDocument();
      expect(screen.getByText(/Avg Clearance Dwell/i)).toBeInTheDocument();
      expect(screen.getByText(/EV & Hybrid Share/i)).toBeInTheDocument();
      expect(screen.getByText('13.7%')).toBeInTheDocument();

      // Verify Charts Sections are rendered
      expect(screen.getByText(/Import Volume by Vehicle Manufacturer/i)).toBeInTheDocument();
      expect(screen.getByText(/Powertrain & Fuel Transition/i)).toBeInTheDocument();
      expect(screen.getByText(/Port & Terminal Dwell Time Trends/i)).toBeInTheDocument();
      expect(screen.getByText(/Customs Tax Revenue Breakdown/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. DEMO ROLE SWITCHING RESILIENCE (ALL 8 PERSONAS)
  // =========================================================================
  describe('Adversarial Test 2: Rapid 1-Click Role Switching Across All 8 Personas', () => {
    const TestRoleSwitcherHarness: React.FC = () => {
      const { user, switchRole, isAuthenticated } = useAuth();
      return (
        <div>
          <div data-testid="auth-state">{isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS'}</div>
          <div data-testid="user-role">{user?.role}</div>
          <div data-testid="user-email">{user?.email}</div>
          <div data-testid="user-org">{user?.organization}</div>
          <div data-testid="user-name">{user?.fullName}</div>
          <button data-testid="btn-super-admin" onClick={() => switchRole('SUPER_ADMIN')}>SuperAdmin</button>
          <button data-testid="btn-importer" onClick={() => switchRole('IMPORTER_SUPPLIER')}>Importer</button>
          <button data-testid="btn-shipping" onClick={() => switchRole('SHIPPING_COMPANY')}>Shipping</button>
          <button data-testid="btn-port" onClick={() => switchRole('PORT_OPERATOR')}>Port</button>
          <button data-testid="btn-customs" onClick={() => switchRole('CUSTOMS_AUTHORITY')}>Customs</button>
          <button data-testid="btn-transport" onClick={() => switchRole('TRANSPORT_FORWARDER')}>Transport</button>
          <button data-testid="btn-finance" onClick={() => switchRole('FINANCIAL_INSURANCE')}>Finance</button>
          <button data-testid="btn-registration" onClick={() => switchRole('VEHICLE_REGISTRATION')}>Registration</button>
        </div>
      );
    };

    it('instantly transitions through all 8 roles and updates session state accurately', () => {
      render(
        <LanguageProvider>
          <AuthProvider>
            <TestRoleSwitcherHarness />
          </AuthProvider>
        </LanguageProvider>
      );

      const allRoles: UserRole[] = [
        'SUPER_ADMIN',
        'IMPORTER_SUPPLIER',
        'SHIPPING_COMPANY',
        'PORT_OPERATOR',
        'CUSTOMS_AUTHORITY',
        'TRANSPORT_FORWARDER',
        'FINANCIAL_INSURANCE',
        'VEHICLE_REGISTRATION',
      ];

      allRoles.forEach((role) => {
        const expected = DEMO_USERS[role];
        const btnKey = role === 'SUPER_ADMIN' ? 'btn-super-admin'
          : role === 'IMPORTER_SUPPLIER' ? 'btn-importer'
          : role === 'SHIPPING_COMPANY' ? 'btn-shipping'
          : role === 'PORT_OPERATOR' ? 'btn-port'
          : role === 'CUSTOMS_AUTHORITY' ? 'btn-customs'
          : role === 'TRANSPORT_FORWARDER' ? 'btn-transport'
          : role === 'FINANCIAL_INSURANCE' ? 'btn-finance'
          : 'btn-registration';

        fireEvent.click(screen.getByTestId(btnKey));

        expect(screen.getByTestId('user-role')).toHaveTextContent(role);
        expect(screen.getByTestId('user-email')).toHaveTextContent(expected.email);
        expect(screen.getByTestId('user-org')).toHaveTextContent(expected.organization || '');
        expect(screen.getByTestId('user-name')).toHaveTextContent(expected.fullName);
        expect(localStorage.getItem('ncis_role')).toBe(role);
        expect(localStorage.getItem('ncis_token')).toBe(`demo-token-${role.toLowerCase()}`);
      });
    });

    it('survives rapid high-frequency role hammering (50 rapid switches) without crashing or corruption', () => {
      render(
        <LanguageProvider>
          <AuthProvider>
            <TestRoleSwitcherHarness />
          </AuthProvider>
        </LanguageProvider>
      );

      const roles: UserRole[] = [
        'SUPER_ADMIN',
        'IMPORTER_SUPPLIER',
        'SHIPPING_COMPANY',
        'PORT_OPERATOR',
        'CUSTOMS_AUTHORITY',
        'TRANSPORT_FORWARDER',
        'FINANCIAL_INSURANCE',
        'VEHICLE_REGISTRATION',
      ];

      // Rapidly trigger 50 switches in sequence
      for (let i = 0; i < 50; i++) {
        const targetRole = roles[i % roles.length];
        const btnKey = targetRole === 'SUPER_ADMIN' ? 'btn-super-admin'
          : targetRole === 'IMPORTER_SUPPLIER' ? 'btn-importer'
          : targetRole === 'SHIPPING_COMPANY' ? 'btn-shipping'
          : targetRole === 'PORT_OPERATOR' ? 'btn-port'
          : targetRole === 'CUSTOMS_AUTHORITY' ? 'btn-customs'
          : targetRole === 'TRANSPORT_FORWARDER' ? 'btn-transport'
          : targetRole === 'FINANCIAL_INSURANCE' ? 'btn-finance'
          : 'btn-registration';

        fireEvent.click(screen.getByTestId(btnKey));
      }

      // Final expected role is roles[49 % 8] = roles[1] = IMPORTER_SUPPLIER
      expect(screen.getByTestId('user-role')).toHaveTextContent('IMPORTER_SUPPLIER');
      expect(screen.getByTestId('user-email')).toHaveTextContent(DEMO_USERS.IMPORTER_SUPPLIER.email);
    });

    it('mounts all 8 individual stakeholder dashboard pages cleanly', () => {
      const dashboards = [
        { component: <SuperAdminDashboard />, name: 'SuperAdminDashboard' },
        { component: <ImporterDashboard />, name: 'ImporterDashboard' },
        { component: <ShippingDashboard />, name: 'ShippingDashboard' },
        { component: <PortOperatorDashboard />, name: 'PortOperatorDashboard' },
        { component: <CustomsDashboard />, name: 'CustomsDashboard' },
        { component: <TransportDashboard />, name: 'TransportDashboard' },
        { component: <FinanceDashboard />, name: 'FinanceDashboard' },
        { component: <RegistrationDashboard />, name: 'RegistrationDashboard' },
      ];

      dashboards.forEach(({ component }) => {
        const { unmount } = render(
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <AuthProvider>
                <MemoryRouter>
                  {component}
                </MemoryRouter>
              </AuthProvider>
            </LanguageProvider>
          </QueryClientProvider>
        );

        // Confirm mounting didn't throw and rendered content
        expect(document.body).toBeInTheDocument();
        unmount();
      });
    });
  });

  // =========================================================================
  // 3. BILINGUAL I18N KEY PARITY & STRESS PROBING
  // =========================================================================
  describe('Adversarial Test 3: Bilingual i18n Key Parity & Switching Stress', () => {
    function getLeafKeys(obj: any, prefix = ''): string[] {
      let keys: string[] = [];
      for (const k of Object.keys(obj)) {
        const fullPath = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          keys = keys.concat(getLeafKeys(obj[k], fullPath));
        } else {
          keys.push(fullPath);
        }
      }
      return keys;
    }

    it('verifies 100% complete 1:1 translation key parity between English and Amharic dictionaries', () => {
      const enKeys = getLeafKeys(enTranslations).sort();
      const amKeys = getLeafKeys(amTranslations).sort();

      // Check missing keys in Amharic
      const missingInAmharic = enKeys.filter((k) => !amKeys.includes(k));
      expect(missingInAmharic, `Missing Amharic translations for: ${missingInAmharic.join(', ')}`).toEqual([]);

      // Check extra keys in Amharic
      const missingInEnglish = amKeys.filter((k) => !enKeys.includes(k));
      expect(missingInEnglish, `Missing English translations for: ${missingInEnglish.join(', ')}`).toEqual([]);

      // Verify that no translation string in Amharic is empty or undefined
      enKeys.forEach((key) => {
        const pathParts = key.split('.');
        let valAm: any = amTranslations;
        let valEn: any = enTranslations;
        for (const p of pathParts) {
          valAm = valAm[p];
          valEn = valEn[p];
        }
        expect(typeof valAm).toBe('string');
        expect(valAm.trim().length).toBeGreaterThan(0);
        expect(typeof valEn).toBe('string');
        expect(valEn.trim().length).toBeGreaterThan(0);
      });
    });

    it('gracefully handles missing keys and nested paths with defaultValue or path string', () => {
      const I18nStressTestComponent: React.FC = () => {
        const { t, setLanguage, language } = useTranslation();
        return (
          <div>
            <span data-testid="lang-val">{language}</span>
            <span data-testid="t-valid">{t('nav.brand')}</span>
            <span data-testid="t-missing-default">{t('completely.nonexistent.key', 'My Default Fallback')}</span>
            <span data-testid="t-missing-nodefault">{t('another.nonexistent.key')}</span>
            <button data-testid="btn-set-am" onClick={() => setLanguage('am')}>Set Amharic</button>
            <button data-testid="btn-set-en" onClick={() => setLanguage('en')}>Set English</button>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <I18nStressTestComponent />
        </LanguageProvider>
      );

      // Verify English valid
      expect(screen.getByTestId('t-valid')).toHaveTextContent('NCIS Portal');

      // Verify missing key with fallback
      expect(screen.getByTestId('t-missing-default')).toHaveTextContent('My Default Fallback');

      // Verify missing key without fallback returns key path
      expect(screen.getByTestId('t-missing-nodefault')).toHaveTextContent('another.nonexistent.key');

      // Rapidly toggle between Amharic and English 50 times
      for (let i = 0; i < 50; i++) {
        fireEvent.click(screen.getByTestId('btn-set-am'));
        fireEvent.click(screen.getByTestId('btn-set-en'));
      }

      // Confirm steady state after rapid toggling
      expect(screen.getByTestId('lang-val')).toHaveTextContent('en');
      expect(screen.getByTestId('t-valid')).toHaveTextContent('NCIS Portal');
    });
  });

  // =========================================================================
  // 4. ETHIOPIAN CUSTOMS DUTY ENGINE ADVERSARIAL BOUNDARY PROBING
  // =========================================================================
  describe('Adversarial Test 4: Customs Duty Engine Mathematical Boundaries', () => {
    it('handles zero CIF without NaN or unhandled divide-by-zero errors', () => {
      const res = computeEthiopianCustomsDuty({
        cifValue: 0,
        engineCapacityCc: 1500,
        fuelType: 'PETROL',
        vehicleCategory: 'PASSENGER',
        productionYear: 2024,
      });

      expect(res.cifValue).toBe(0);
      expect(res.dutyAmount).toBe(0);
      expect(res.exciseAmount).toBe(0);
      expect(res.vatAmount).toBe(0);
      expect(res.surtaxAmount).toBe(0);
      expect(res.withholdingAmount).toBe(0);
      expect(res.totalPayable).toBe(0);
      expect(Number.isNaN(res.totalPayable)).toBe(false);
    });

    it('enforces EV 5% flat incentive irrespective of engine displacement or vehicle size', () => {
      const evRes = computeEthiopianCustomsDuty({
        cifValue: 3000000,
        engineCapacityCc: 0,
        fuelType: 'ELECTRIC',
        vehicleCategory: 'PASSENGER',
        productionYear: 2025,
      });

      // EV excise rate must strictly be 0.05
      expect(evRes.exciseRate).toBe(0.05);

      // Duty 35% on 3M = 1,050,000
      expect(evRes.dutyAmount).toBe(1050000);
      // Excise 5% on 4,050,000 = 202,500
      expect(evRes.exciseAmount).toBe(202500);
      // VAT 15% on 4,252,500 = 637,875
      expect(evRes.vatAmount).toBe(637875);
      // Surtax 10% on 4,252,500 = 425,250
      expect(evRes.surtaxAmount).toBe(425250);
      // Withholding 3% on 3M = 90,000
      expect(evRes.withholdingAmount).toBe(90000);
      // Total
      expect(evRes.totalPayable).toBe(1050000 + 202500 + 637875 + 425250 + 90000);
    });

    it('tests engine displacement excise tax brackets (<=1300cc: 30%, 1301-1800cc: 60%, >1800cc: 100%)', () => {
      const cif = 1000000;

      // Tier 1: 1300 cc boundary
      const tier1 = computeEthiopianCustomsDuty({
        cifValue: cif,
        engineCapacityCc: 1300,
        fuelType: 'PETROL',
        vehicleCategory: 'PASSENGER',
        productionYear: 2024,
      });
      expect(tier1.exciseRate).toBe(0.30);

      // Tier 2: 1301 cc boundary
      const tier2a = computeEthiopianCustomsDuty({
        cifValue: cif,
        engineCapacityCc: 1301,
        fuelType: 'PETROL',
        vehicleCategory: 'PASSENGER',
        productionYear: 2024,
      });
      expect(tier2a.exciseRate).toBe(0.60);

      // Tier 2: 1800 cc boundary
      const tier2b = computeEthiopianCustomsDuty({
        cifValue: cif,
        engineCapacityCc: 1800,
        fuelType: 'PETROL',
        vehicleCategory: 'PASSENGER',
        productionYear: 2024,
      });
      expect(tier2b.exciseRate).toBe(0.60);

      // Tier 3: 1801 cc boundary
      const tier3 = computeEthiopianCustomsDuty({
        cifValue: cif,
        engineCapacityCc: 1801,
        fuelType: 'PETROL',
        vehicleCategory: 'PASSENGER',
        productionYear: 2024,
      });
      expect(tier3.exciseRate).toBe(1.00);
    });

    it('tests commercial truck category vs motorcycle category duty tariffs', () => {
      const commercial = computeEthiopianCustomsDuty({
        cifValue: 2000000,
        engineCapacityCc: 4000,
        fuelType: 'DIESEL',
        vehicleCategory: 'COMMERCIAL',
        productionYear: 2024,
      });
      expect(commercial.dutyRate).toBe(0.10);
      expect(commercial.dutyAmount).toBe(200000);

      const moto = computeEthiopianCustomsDuty({
        cifValue: 200000,
        engineCapacityCc: 150,
        fuelType: 'PETROL',
        vehicleCategory: 'MOTORCYCLE',
        productionYear: 2024,
      });
      expect(moto.dutyRate).toBe(0.30);
      expect(moto.dutyAmount).toBe(60000);
    });
  });

  // =========================================================================
  // 5. CRYPTOGRAPHIC HASH CHAIN & OCR VERIFICATION
  // =========================================================================
  describe('Adversarial Test 5: Cryptographic Chain & OCR Simulation Robustness', () => {
    it('successfully validates SHA-256 hash chain verification', async () => {
      const result = await api.verifyChain();
      expect(result.valid).toBe(true);
      expect(result.verifiedBlocks).toBeGreaterThan(0);
      expect(result.message).toContain('Cryptographic SHA-256 hash chain verified');
    });

    it('successfully performs OCR scan simulation for invoice and bill of lading', async () => {
      const invoiceOcr = await api.runOcrScan('INVOICE');
      expect(invoiceOcr.success).toBe(true);
      expect(invoiceOcr.confidence).toBeGreaterThanOrEqual(0.95);
      expect(invoiceOcr.extractedData.vin).toBe('JTJHY7AX8N4029182');
      expect(invoiceOcr.extractedData.make).toBe('Toyota');

      const bolOcr = await api.runOcrScan('BOL');
      expect(bolOcr.success).toBe(true);
      expect(bolOcr.confidence).toBeGreaterThanOrEqual(0.95);
      expect(bolOcr.extractedData.bolNumber).toBe('HML-DXB-849201');
    });
  });
});
