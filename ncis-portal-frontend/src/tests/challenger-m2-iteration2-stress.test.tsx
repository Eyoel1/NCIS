import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth, DEMO_USERS } from '../context/AuthContext';
import { LanguageProvider, useTranslation } from '../context/LanguageContext';
import { enTranslations } from '../locales/en';
import { amTranslations } from '../locales/am';
import { api } from '../services/api';
import { MOCK_SHIPMENTS } from '../services/mockData';
import { UserRole, Shipment, Vehicle } from '../types';

// Components under empirical review
import { VehicleDossierCard } from '../components/tracking/VehicleDossierCard';
import { VehicleQrModal } from '../components/qr/VehicleQrModal';
import { PublicTrackerPage } from '../pages/PublicTrackerPage';
import { DemoRoleSwitcher } from '../components/common/DemoRoleSwitcher';
import { LanguageToggle } from '../components/common/LanguageToggle';

// 8 Stakeholder Dashboards
import { SuperAdminDashboard } from '../pages/dashboards/SuperAdminDashboard';
import { ImporterDashboard } from '../pages/dashboards/ImporterDashboard';
import { ShippingDashboard } from '../pages/dashboards/ShippingDashboard';
import { PortOperatorDashboard } from '../pages/dashboards/PortOperatorDashboard';
import { CustomsDashboard } from '../pages/dashboards/CustomsDashboard';
import { TransportDashboard } from '../pages/dashboards/TransportDashboard';
import { FinanceDashboard } from '../pages/dashboards/FinanceDashboard';
import { RegistrationDashboard } from '../pages/dashboards/RegistrationDashboard';

// Mock Leaflet CorridorMap for headless JSDOM
vi.mock('../components/map/CorridorMap', () => ({
  CorridorMap: ({ shipments, focusedShipmentId }: any) => (
    <div data-testid="mocked-corridor-map" data-shipment-count={shipments?.length}>
      Map Rendered: {focusedShipmentId || 'Overview'}
    </div>
  ),
}));

// Mock Recharts ResponsiveContainer
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

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
}

describe('Challenger M2-3: Empirical Defect Remediation & Adversarial Stress Probing', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  // =========================================================================
  // SUITE 1: VehicleDossierCard & /track/:id Adversarial Stress Probing
  // =========================================================================
  describe('Suite 1: VehicleDossierCard & Public Tracking Route Stress', () => {
    it('1.1 Renders valid shipment from api.trackPublic without TypeError and displays cifValue and engineCc', async () => {
      const publicShipment = await api.trackPublic('ET-SHP-2026-001');

      expect(publicShipment.trackingNumber).toBe('ET-SHP-2026-001');
      expect(publicShipment.vehicles).toBeDefined();
      expect(publicShipment.vehicles.length).toBeGreaterThan(0);

      const v = publicShipment.vehicles[0];
      expect(v.cifValue).toBe(3450000);
      expect(v.engineCc).toBe(2755);

      const { unmount } = render(
        <LanguageProvider>
          <VehicleDossierCard shipment={publicShipment as Shipment} />
        </LanguageProvider>
      );

      // Verify Assessed CIF and Engine CC are formatted and displayed
      expect(screen.getByText(/3,450,000 ETB/i)).toBeInTheDocument();
      expect(screen.getByText(/2755 cc/i)).toBeInTheDocument();
      expect(screen.getByText(/Toyota Land Cruiser Prado/i)).toBeInTheDocument();
      expect(screen.getByText(/VIN:/i)).toBeInTheDocument();
      expect(screen.getByText(/Plate: Pending Plate Issuance/i)).toBeInTheDocument();
      unmount();
    });

    it('1.2 Renders vehicle when cifValue and engineCc are undefined without throwing TypeError', () => {
      const shipmentWithUndefinedVehicle: Shipment = {
        ...MOCK_SHIPMENTS[0],
        vehicles: [
          {
            id: 'veh-undef-props',
            shipmentId: 'shp-001',
            vin: 'VIN-TEST-UNDEF',
            make: 'Hyundai',
            model: 'Tucson',
            year: 2024,
            fuelType: 'HYBRID',
            color: 'Silver',
            cifValue: undefined as any,
            engineCc: undefined as any,
          } as any,
        ],
      };

      let threw = false;
      try {
        render(
          <LanguageProvider>
            <VehicleDossierCard shipment={shipmentWithUndefinedVehicle} />
          </LanguageProvider>
        );
      } catch (e) {
        threw = true;
      }

      expect(threw).toBe(false);
      expect(screen.getByText('0 ETB')).toBeInTheDocument();
      expect(screen.getByText('0 cc')).toBeInTheDocument();
      expect(screen.getByText(/Hyundai Tucson/i)).toBeInTheDocument();
    });

    it('1.3 Renders vehicle when cifValue and engineCc are null without throwing TypeError', () => {
      const shipmentWithNullVehicle: Shipment = {
        ...MOCK_SHIPMENTS[0],
        vehicles: [
          {
            id: 'veh-null-props',
            shipmentId: 'shp-001',
            vin: 'VIN-TEST-NULL',
            make: 'Isuzu',
            model: 'FSR 33',
            year: 2023,
            fuelType: 'DIESEL',
            color: 'White',
            cifValue: null as any,
            engineCc: null as any,
          } as any,
        ],
      };

      let threw = false;
      try {
        render(
          <LanguageProvider>
            <VehicleDossierCard shipment={shipmentWithNullVehicle} />
          </LanguageProvider>
        );
      } catch (e) {
        threw = true;
      }

      expect(threw).toBe(false);
      expect(screen.getByText('0 ETB')).toBeInTheDocument();
      expect(screen.getByText('0 cc')).toBeInTheDocument();
    });

    it('1.4 Renders vehicle when vehicle object is empty {} without throwing', () => {
      const shipmentWithEmptyVehicle: Shipment = {
        ...MOCK_SHIPMENTS[0],
        vehicles: [{} as any],
      };

      let threw = false;
      try {
        render(
          <LanguageProvider>
            <VehicleDossierCard shipment={shipmentWithEmptyVehicle} />
          </LanguageProvider>
        );
      } catch (e) {
        threw = true;
      }

      expect(threw).toBe(false);
      expect(screen.getByText('0 ETB')).toBeInTheDocument();
      expect(screen.getByText('0 cc')).toBeInTheDocument();
      expect(screen.getByText(/Unknown/i)).toBeInTheDocument();
    });

    it('1.5 Renders when shipment.vehicles is empty [] or undefined by using fallback vehicle', () => {
      const shipmentNoVehicles: Shipment = {
        ...MOCK_SHIPMENTS[0],
        vehicles: [],
      };

      render(
        <LanguageProvider>
          <VehicleDossierCard shipment={shipmentNoVehicles} />
        </LanguageProvider>
      );

      // Falls back to default Corolla vehicle
      expect(screen.getByText(/Toyota Corolla/i)).toBeInTheDocument();
      expect(screen.getByText(/2,500,000 ETB/i)).toBeInTheDocument();
      expect(screen.getByText(/1800 cc/i)).toBeInTheDocument();
    });

    it('1.6 Renders vehicle with extreme numeric values (zero, negative, very large)', () => {
      const extremeShipment: Shipment = {
        ...MOCK_SHIPMENTS[0],
        vehicles: [
          {
            id: 'veh-extreme',
            shipmentId: 'shp-001',
            vin: 'EXTREME-VIN',
            make: 'Special',
            model: 'Custom',
            year: 2025,
            fuelType: 'ELECTRIC',
            cifValue: 9876543210,
            engineCc: 6200,
          } as any,
        ],
      };

      render(
        <LanguageProvider>
          <VehicleDossierCard shipment={extremeShipment} />
        </LanguageProvider>
      );

      expect(screen.getByText(/9,876,543,210 ETB/i)).toBeInTheDocument();
      expect(screen.getByText(/6200 cc/i)).toBeInTheDocument();
    });

    it('1.7 Opens and closes QR Code Pass modal cleanly even with minimal vehicle data', () => {
      const minShipment: Shipment = {
        ...MOCK_SHIPMENTS[0],
        vehicles: [
          {
            id: 'veh-min',
            shipmentId: 'shp-001',
            vin: 'ETH-MIN-VIN-001',
            make: 'BYD',
            model: 'Atto 3',
            year: 2024,
            fuelType: 'ELECTRIC',
            cifValue: 1800000,
            engineCc: 0,
          } as any,
        ],
      };

      render(
        <LanguageProvider>
          <VehicleDossierCard shipment={minShipment} />
        </LanguageProvider>
      );

      // Click QR Pass
      const qrPassBtn = screen.getByRole('button', { name: /View QR Pass/i });
      fireEvent.click(qrPassBtn);

      // Verify modal is visible
      expect(screen.getByText(/Official Transit Verification Pass/i)).toBeInTheDocument();
      expect(screen.getAllByText(/ETH-MIN-VIN-001/i).length).toBe(2);
      expect(screen.getAllByText(/BYD Atto 3/i).length).toBeGreaterThanOrEqual(1);

      // Click Close button
      const closeBtns = screen.getAllByRole('button', { name: /Close/i }); const closeBtn = closeBtns[0];
      fireEvent.click(closeBtn);

      // Modal should be closed
      expect(screen.queryByText(/Official Transit Verification Pass/i)).not.toBeInTheDocument();
    });

    it('1.8 Copies shareable link to clipboard on button click', async () => {
      render(
        <LanguageProvider>
          <VehicleDossierCard shipment={MOCK_SHIPMENTS[0]} />
        </LanguageProvider>
      );

      const shareBtn = screen.getByText(/Copy Shareable Link/i);
      fireEvent.click(shareBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(screen.getByText(/Link copied to clipboard!/i)).toBeInTheDocument();
    });

    it('1.9 Full PublicTrackerPage end-to-end mounts and renders with live tracker query', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/track/ET-SHP-2026-001']}>
                <Routes>
                  <Route path="/track/:id" element={<PublicTrackerPage />} />
                </Routes>
              </MemoryRouter>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      );

      // Stepper renders
      expect(await screen.findByText(/End-to-End Import Lifecycle Progress/i)).toBeInTheDocument();
      // Vehicle Dossier assessed CIF rendered
      expect(screen.getAllByText(/3,450,000 ETB/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2755 cc/i)).toBeInTheDocument();
      // Map renders
      expect(screen.getByTestId('mocked-corridor-map')).toBeInTheDocument();
      // Customs Assessment renders
      expect(screen.getByText(/Customs Clearance Assessment/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 2: Rapid 1-Click Role Switching Stress Across All 8 Roles
  // =========================================================================
  describe('Suite 2: 1-Click Role Switching Stress Across 8 Stakeholders', () => {
    const Harness: React.FC = () => {
      const { user, switchRole, isAuthenticated } = useAuth();
      return (
        <div>
          <div data-testid="auth-status">{isAuthenticated ? 'YES' : 'NO'}</div>
          <div data-testid="role-text">{user?.role || ''}</div>
          <div data-testid="email-text">{user?.email || ''}</div>
          <div data-testid="org-text">{user?.organization || ''}</div>
          <div data-testid="name-text">{user?.fullName || ''}</div>

          <DemoRoleSwitcher />

          <button data-testid="switch-admin" onClick={() => switchRole('SUPER_ADMIN')}>Super Admin</button>
          <button data-testid="switch-importer" onClick={() => switchRole('IMPORTER_SUPPLIER')}>Importer</button>
          <button data-testid="switch-shipping" onClick={() => switchRole('SHIPPING_COMPANY')}>Shipping</button>
          <button data-testid="switch-port" onClick={() => switchRole('PORT_OPERATOR')}>Port</button>
          <button data-testid="switch-customs" onClick={() => switchRole('CUSTOMS_AUTHORITY')}>Customs</button>
          <button data-testid="switch-transport" onClick={() => switchRole('TRANSPORT_FORWARDER')}>Transport</button>
          <button data-testid="switch-finance" onClick={() => switchRole('FINANCIAL_INSURANCE')}>Finance</button>
          <button data-testid="switch-registration" onClick={() => switchRole('VEHICLE_REGISTRATION')}>Registration</button>
        </div>
      );
    };

    it('2.1 Sequentially cycles through all 8 roles, verifying exact sync of session credentials', () => {
      render(
        <LanguageProvider>
          <AuthProvider>
            <Harness />
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

      roles.forEach((role) => {
        const expected = DEMO_USERS[role];
        const btnId = role === 'SUPER_ADMIN' ? 'switch-admin'
          : role === 'IMPORTER_SUPPLIER' ? 'switch-importer'
          : role === 'SHIPPING_COMPANY' ? 'switch-shipping'
          : role === 'PORT_OPERATOR' ? 'switch-port'
          : role === 'CUSTOMS_AUTHORITY' ? 'switch-customs'
          : role === 'TRANSPORT_FORWARDER' ? 'switch-transport'
          : role === 'FINANCIAL_INSURANCE' ? 'switch-finance'
          : 'switch-registration';

        fireEvent.click(screen.getByTestId(btnId));

        expect(screen.getByTestId('auth-status')).toHaveTextContent('YES');
        expect(screen.getByTestId('role-text')).toHaveTextContent(role);
        expect(screen.getByTestId('email-text')).toHaveTextContent(expected.email);
        expect(screen.getByTestId('org-text')).toHaveTextContent(expected.organization || '');
        expect(screen.getByTestId('name-text')).toHaveTextContent(expected.fullName);
        expect(localStorage.getItem('ncis_role')).toBe(role);
        expect(localStorage.getItem('ncis_token')).toBe(`demo-token-${role.toLowerCase()}`);
      });
    });

    it('2.2 Performs 100 rapid pseudo-random role switches without crash or state corruption', () => {
      render(
        <LanguageProvider>
          <AuthProvider>
            <Harness />
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

      const btnMap: Record<UserRole, string> = {
        SUPER_ADMIN: 'switch-admin',
        IMPORTER_SUPPLIER: 'switch-importer',
        SHIPPING_COMPANY: 'switch-shipping',
        PORT_OPERATOR: 'switch-port',
        CUSTOMS_AUTHORITY: 'switch-customs',
        TRANSPORT_FORWARDER: 'switch-transport',
        FINANCIAL_INSURANCE: 'switch-finance',
        VEHICLE_REGISTRATION: 'switch-registration',
      };

      // 100 rapid transitions
      let lastRole: UserRole = 'SUPER_ADMIN';
      for (let i = 0; i < 100; i++) {
        const roleIdx = (i * 7 + 3) % roles.length;
        const targetRole = roles[roleIdx];
        fireEvent.click(screen.getByTestId(btnMap[targetRole]));
        lastRole = targetRole;
      }

      const expected = DEMO_USERS[lastRole];
      expect(screen.getByTestId('role-text')).toHaveTextContent(lastRole);
      expect(screen.getByTestId('email-text')).toHaveTextContent(expected.email);
      expect(screen.getByTestId('org-text')).toHaveTextContent(expected.organization || '');
      expect(localStorage.getItem('ncis_role')).toBe(lastRole);
    });

    it('2.3 Mounts all 8 individual stakeholder dashboard views cleanly in their authentic roles', () => {
      const dashboards = [
        { role: 'SUPER_ADMIN', comp: <SuperAdminDashboard /> },
        { role: 'IMPORTER_SUPPLIER', comp: <ImporterDashboard /> },
        { role: 'SHIPPING_COMPANY', comp: <ShippingDashboard /> },
        { role: 'PORT_OPERATOR', comp: <PortOperatorDashboard /> },
        { role: 'CUSTOMS_AUTHORITY', comp: <CustomsDashboard /> },
        { role: 'TRANSPORT_FORWARDER', comp: <TransportDashboard /> },
        { role: 'FINANCIAL_INSURANCE', comp: <FinanceDashboard /> },
        { role: 'VEHICLE_REGISTRATION', comp: <RegistrationDashboard /> },
      ];

      dashboards.forEach(({ role, comp }) => {
        localStorage.setItem('ncis_role', role);
        localStorage.setItem('ncis_user', JSON.stringify(DEMO_USERS[role as UserRole]));

        const { unmount } = render(
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <AuthProvider>
                <MemoryRouter>
                  {comp}
                </MemoryRouter>
              </AuthProvider>
            </LanguageProvider>
          </QueryClientProvider>
        );

        expect(document.body).toBeInTheDocument();
        unmount();
      });
    });
  });

  // =========================================================================
  // SUITE 3: Bilingual i18n Dictionary Parity & Rapid Toggling Stress
  // =========================================================================
  describe('Suite 3: Bilingual i18n Parity & Rapid Switching Stress', () => {
    function extractLeafKeys(obj: any, prefix = ''): string[] {
      let keys: string[] = [];
      for (const k of Object.keys(obj)) {
        const fullPath = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          keys = keys.concat(extractLeafKeys(obj[k], fullPath));
        } else {
          keys.push(fullPath);
        }
      }
      return keys;
    }

    it('3.1 Enforces 100% leaf translation key parity between English and Amharic dictionaries', () => {
      const enKeys = extractLeafKeys(enTranslations).sort();
      const amKeys = extractLeafKeys(amTranslations).sort();

      const missingInAm = enKeys.filter((k) => !amKeys.includes(k));
      expect(missingInAm, `Missing Amharic keys: ${missingInAm.join(', ')}`).toEqual([]);

      const missingInEn = amKeys.filter((k) => !enKeys.includes(k));
      expect(missingInEn, `Missing English keys: ${missingInEn.join(', ')}`).toEqual([]);

      // Verify no empty string or undefined value exists in either locale
      enKeys.forEach((k) => {
        const parts = k.split('.');
        let curEn: any = enTranslations;
        let curAm: any = amTranslations;
        for (const p of parts) {
          curEn = curEn[p];
          curAm = curAm[p];
        }
        expect(typeof curEn).toBe('string');
        expect(curEn.trim().length).toBeGreaterThan(0);
        expect(typeof curAm).toBe('string');
        expect(curAm.trim().length).toBeGreaterThan(0);
      });
    });

    it('3.2 Performs 100 rapid sequential language toggles (en <-> am) maintaining accurate state', () => {
      const I18nTester: React.FC = () => {
        const { t, language } = useTranslation();
        return (
          <div>
            <div data-testid="current-lang">{language}</div>
            <div data-testid="brand-title">{t('nav.brand')}</div>
            <LanguageToggle />
          </div>
        );
      };

      render(
        <LanguageProvider>
          <I18nTester />
        </LanguageProvider>
      );

      // Rapidly toggle 50 round-trips (100 switches)
      for (let i = 0; i < 50; i++) {
        fireEvent.click(screen.getByTestId('lang-am-btn'));
        fireEvent.click(screen.getByTestId('lang-en-btn'));
      }

      // After round-trips, language should be en
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('brand-title')).toHaveTextContent('NCIS Portal');
      expect(localStorage.getItem('ncis_lang')).toBe('en');

      // 101st toggle to am
      fireEvent.click(screen.getByTestId('lang-am-btn'));
      expect(screen.getByTestId('current-lang')).toHaveTextContent('am');
      expect(screen.getByTestId('brand-title')).toHaveTextContent(amTranslations.nav.brand);
      expect(localStorage.getItem('ncis_lang')).toBe('am');
    });

    it('3.3 Handles malformed or non-existent key requests gracefully', () => {
      const FallbackTester: React.FC = () => {
        const { t } = useTranslation();
        return (
          <div>
            <span data-testid="with-def">{t('completely.missing.key', 'Def Value')}</span>
            <span data-testid="no-def">{t('missing.key.without.default')}</span>
            <span data-testid="empty-key">{t('')}</span>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <FallbackTester />
        </LanguageProvider>
      );

      expect(screen.getByTestId('with-def')).toHaveTextContent('Def Value');
      expect(screen.getByTestId('no-def')).toHaveTextContent('missing.key.without.default');
      expect(screen.getByTestId('empty-key')).toHaveTextContent('');
    });
  });
});
