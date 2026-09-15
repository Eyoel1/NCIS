import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Auth & Session REST API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login - should authenticate Super Admin with demo 2FA bypass', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@ncis.gov.et',
        password: 'Demo@2026!',
        demoBypass: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('token');
    expect(body.user.email).toBe('admin@ncis.gov.et');
    expect(body.user.role).toBe('SUPER_ADMIN');
    expect(body.twoFactorBypassed).toBe(true);
  });

  it('POST /api/auth/login - should reject invalid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@ncis.gov.et',
        password: 'WrongPassword123!',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/login - should authenticate Customs Officer with demo code 123456', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'customs@ecc.gov.et',
        password: 'Demo@2026!',
        twoFactorCode: '123456',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.user.role).toBe('CUSTOMS_AUTHORITY');
    expect(body.user.organization).toContain('Customs');
  });

  it('GET /api/auth/me - should return logged-in profile with valid JWT', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'importer@ethioimport.com',
        password: 'Demo@2026!',
        demoBypass: true,
      },
    });

    const token = JSON.parse(loginRes.payload).token;

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.statusCode).toBe(200);
    const meBody = JSON.parse(meRes.payload);
    expect(meBody.user.email).toBe('importer@ethioimport.com');
    expect(meBody.user.role).toBe('IMPORTER_SUPPLIER');
  });

  it('GET /api/auth/me - should reject request without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(res.statusCode).toBe(401);
  });

  it('GET /api/auth/demo-users - should list all 8 stakeholder profiles', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/demo-users',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.users.length).toBe(8);

    const roles = body.users.map((u: any) => u.role);
    expect(roles).toContain('SUPER_ADMIN');
    expect(roles).toContain('IMPORTER_SUPPLIER');
    expect(roles).toContain('SHIPPING_COMPANY');
    expect(roles).toContain('PORT_OPERATOR');
    expect(roles).toContain('CUSTOMS_AUTHORITY');
    expect(roles).toContain('TRANSPORT_FORWARDER');
    expect(roles).toContain('FINANCIAL_INSURANCE');
    expect(roles).toContain('VEHICLE_REGISTRATION');
  });

  it('POST /api/auth/demo-switch - should switch to PORT_OPERATOR instantly', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/demo-switch',
      payload: {
        role: 'PORT_OPERATOR',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.user.role).toBe('PORT_OPERATOR');
    expect(body.user.email).toBe('port@djibouti-port.com');
    expect(body).toHaveProperty('token');
  });
});
