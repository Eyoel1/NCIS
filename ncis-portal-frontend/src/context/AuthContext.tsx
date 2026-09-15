import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

export const DEMO_USERS: Record<UserRole, User> = {
  SUPER_ADMIN: {
    id: 'usr-admin-01',
    email: 'admin@ncis.gov.et',
    fullName: 'Abebe Kebede',
    role: 'SUPER_ADMIN',
    organization: 'NCIS National Command',
    phone: '+251 91 123 4567',
    demoTwoFactorBypass: true,
  },
  IMPORTER_SUPPLIER: {
    id: 'usr-imp-01',
    email: 'importer@ethioimport.com',
    fullName: 'Alazar Tadesse',
    role: 'IMPORTER_SUPPLIER',
    organization: 'Ethio Auto Imports PLC',
    phone: '+251 91 234 5678',
    demoTwoFactorBypass: true,
  },
  SHIPPING_COMPANY: {
    id: 'usr-ship-01',
    email: 'shipping@ethiopian-shipping.com',
    fullName: 'Capt. Michael Chen',
    role: 'SHIPPING_COMPANY',
    organization: 'Horn Maritime Line',
    phone: '+251 91 345 6789',
    demoTwoFactorBypass: true,
  },
  PORT_OPERATOR: {
    id: 'usr-port-01',
    email: 'port@djibouti-port.com',
    fullName: 'Fatuma Omar',
    role: 'PORT_OPERATOR',
    organization: 'Djibouti Port Terminal Authority',
    phone: '+253 77 123 456',
    demoTwoFactorBypass: true,
  },
  CUSTOMS_AUTHORITY: {
    id: 'usr-cust-01',
    email: 'customs@ecc.gov.et',
    fullName: 'Yohannes Wolde',
    role: 'CUSTOMS_AUTHORITY',
    organization: 'Ethiopian Customs Commission (ECC)',
    phone: '+251 91 456 7890',
    demoTwoFactorBypass: true,
  },
  TRANSPORT_FORWARDER: {
    id: 'usr-trans-01',
    email: 'forwarder@ethio-transit.com',
    fullName: 'Dawit Haile',
    role: 'TRANSPORT_FORWARDER',
    organization: 'Trans-Ethiopia Logistics PLC',
    phone: '+251 91 567 8901',
    demoTwoFactorBypass: true,
  },
  FINANCIAL_INSURANCE: {
    id: 'usr-fin-01',
    email: 'cbe.finance@cbe.com.et',
    fullName: 'Selamawit Desta',
    role: 'FINANCIAL_INSURANCE',
    organization: 'Commercial Bank of Ethiopia & Nyala Ins.',
    phone: '+251 91 678 9012',
    demoTwoFactorBypass: true,
  },
  VEHICLE_REGISTRATION: {
    id: 'usr-reg-01',
    email: 'fta@motl.gov.et',
    fullName: 'Biruk Assefa',
    role: 'VEHICLE_REGISTRATION',
    organization: 'Federal Transport Authority (FTA)',
    phone: '+251 91 789 0123',
    demoTwoFactorBypass: true,
  },
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, twoFactorCode?: string) => Promise<boolean>;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  demoBypassActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('ncis_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // Ignore
    }
    // Default to Super Admin for seamless development and evaluation
    return DEMO_USERS.SUPER_ADMIN;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ncis_token') || 'demo-token-super-admin';
    } catch {
      return 'demo-token-super-admin';
    }
  });

  const switchRole = (role: UserRole) => {
    const newUser = DEMO_USERS[role] || DEMO_USERS.SUPER_ADMIN;
    const newToken = `demo-token-${role.toLowerCase()}`;
    setUser(newUser);
    setToken(newToken);
    try {
      localStorage.setItem('ncis_user', JSON.stringify(newUser));
      localStorage.setItem('ncis_token', newToken);
      localStorage.setItem('ncis_role', role);
    } catch {
      // Local storage unavailable
    }
  };

  const login = async (email: string, password = 'password123', twoFactorCode = '123456'): Promise<boolean> => {
    // Try hitting the backend API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('ncis_user', JSON.stringify(data.user));
        localStorage.setItem('ncis_token', data.token);
        return true;
      }
    } catch {
      // Fall through to demo user match
    }

    // Demo bypass match
    const matchingRole = (Object.keys(DEMO_USERS) as UserRole[]).find(
      (r) => DEMO_USERS[r].email.toLowerCase() === email.toLowerCase()
    );

    if (matchingRole) {
      switchRole(matchingRole);
      return true;
    }

    // Fallback: log in with requested email
    const fallbackUser: User = {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      role: 'IMPORTER_SUPPLIER',
      demoTwoFactorBypass: true,
    };
    setUser(fallbackUser);
    setToken(`demo-token-${Date.now()}`);
    localStorage.setItem('ncis_user', JSON.stringify(fallbackUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('ncis_user');
      localStorage.removeItem('ncis_token');
      localStorage.removeItem('ncis_role');
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        switchRole,
        logout,
        demoBypassActive: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
