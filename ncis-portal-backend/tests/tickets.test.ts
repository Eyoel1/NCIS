import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Dispute Ticketing REST API', () => {
  let app: FastifyInstance;
  let importerToken: string;
  let customsToken: string;
  let shipmentId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const impLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'importer@ethioimport.com', password: 'Demo@2026!', demoBypass: true },
    });
    importerToken = JSON.parse(impLogin.payload).token;

    const custLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'customs@ecc.gov.et', password: 'Demo@2026!', demoBypass: true },
    });
    customsToken = JSON.parse(custLogin.payload).token;

    const ship = await app.prisma.shipment.findFirst();
    shipmentId = ship!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/tickets - should list dispute tickets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/tickets',
      headers: { Authorization: `Bearer ${importerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.tickets.length).toBeGreaterThanOrEqual(1);
    expect(data.tickets[0]).toHaveProperty('ticketNumber');
    expect(data.tickets[0]).toHaveProperty('messages');
  });

  it('POST /api/tickets - should open a new dispute query with initial message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: { Authorization: `Bearer ${importerToken}` },
      payload: {
        shipmentId,
        assignedRole: 'PORT_OPERATOR',
        title: 'Inquiry on Container Berth Allocation at Djibouti',
        category: 'PORT_DELAY',
        priority: 'HIGH',
        message: 'Can the port operations team advise on current yard staging block for our container?',
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.payload);
    expect(data.ticket.ticketNumber).toMatch(/^DISP-2026-/);
    expect(data.ticket.status).toBe('OPEN');
    expect(data.ticket.priority).toBe('HIGH');
    expect(data.ticket.messages.length).toBe(1);
  });

  it('POST /api/tickets/:id/messages - should append a reply to the ticket thread', async () => {
    const ticket = await app.prisma.ticket.findFirst();
    expect(ticket).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      url: `/api/tickets/${ticket!.id}/messages`,
      headers: { Authorization: `Bearer ${customsToken}` },
      payload: {
        message: 'Official response from Customs Authority: Document review is now underway.',
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.payload);
    expect(data.message.message).toContain('Official response');
  });

  it('PATCH /api/tickets/:id/status - should update ticket status to IN_REVIEW or RESOLVED', async () => {
    const ticket = await app.prisma.ticket.findFirst();
    expect(ticket).toBeDefined();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket!.id}/status`,
      headers: { Authorization: `Bearer ${customsToken}` },
      payload: { status: 'RESOLVED' },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.ticket.status).toBe('RESOLVED');
  });
});
