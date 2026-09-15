import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { DemoRoleSwitcher } from '../components/common/DemoRoleSwitcher';

const RoleDisplayConsumer: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <span data-testid="current-user-role">{user?.role}</span>
      <span data-testid="current-user-name">{user?.fullName}</span>
      <span data-testid="current-user-org">{user?.organization}</span>
      <DemoRoleSwitcher />
    </div>
  );
};

describe('DemoRoleSwitcher Component & AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the role switcher and opens menu with 8 roles and demo 2FA bypass', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <RoleDisplayConsumer />
        </AuthProvider>
      </LanguageProvider>
    );

    // Initial role
    expect(screen.getByTestId('current-user-role')).toHaveTextContent('SUPER_ADMIN');

    // Open dropdown
    const toggleBtn = screen.getByTestId('role-switcher-toggle');
    fireEvent.click(toggleBtn);

    const menu = screen.getByTestId('role-switcher-menu');
    expect(menu).toBeInTheDocument();

    // Verify 2FA demo bypass indicator
    expect(menu).toHaveTextContent('123456');

    // Verify all 8 roles are available in menu
    const expectedRoles = [
      'SUPER_ADMIN',
      'IMPORTER_SUPPLIER',
      'SHIPPING_COMPANY',
      'PORT_OPERATOR',
      'CUSTOMS_AUTHORITY',
      'TRANSPORT_FORWARDER',
      'FINANCIAL_INSURANCE',
      'VEHICLE_REGISTRATION',
    ];

    expectedRoles.forEach((role) => {
      const roleBtn = screen.getByTestId(`role-select-${role}`);
      expect(roleBtn).toBeInTheDocument();
    });
  });

  it('switches to CUSTOMS_AUTHORITY role on 1-click selection', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <RoleDisplayConsumer />
        </AuthProvider>
      </LanguageProvider>
    );

    // Open dropdown
    fireEvent.click(screen.getByTestId('role-switcher-toggle'));

    // Click CUSTOMS_AUTHORITY
    const customsBtn = screen.getByTestId('role-select-CUSTOMS_AUTHORITY');
    fireEvent.click(customsBtn);

    // Verify AuthContext updated
    expect(screen.getByTestId('current-user-role')).toHaveTextContent('CUSTOMS_AUTHORITY');
    expect(screen.getByTestId('current-user-name')).toHaveTextContent('Yohannes Wolde');
    expect(screen.getByTestId('current-user-org')).toHaveTextContent('Ethiopian Customs Commission (ECC)');
  });

  it('switches to VEHICLE_REGISTRATION role on 1-click selection', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <RoleDisplayConsumer />
        </AuthProvider>
      </LanguageProvider>
    );

    fireEvent.click(screen.getByTestId('role-switcher-toggle'));
    fireEvent.click(screen.getByTestId('role-select-VEHICLE_REGISTRATION'));

    expect(screen.getByTestId('current-user-role')).toHaveTextContent('VEHICLE_REGISTRATION');
    expect(screen.getByTestId('current-user-name')).toHaveTextContent('Biruk Assefa');
  });
});
