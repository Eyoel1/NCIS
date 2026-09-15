import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  twoFactorCode: z.string().optional(),
  demoBypass: z.boolean().optional(),
});

export const authRoutes: FastPlugin = async (fastify: FastifyInstance) => {
  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Bad Request', message: parsed.error.issues[0].message });
    }

    const { email, password, twoFactorCode, demoBypass } = parsed.data;

    const user = await fastify.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!isValidPassword) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
    }

    // Check 2FA condition
    const isBypass = demoBypass || user.demoTwoFactorBypass || twoFactorCode === '123456';
    if (!isBypass && twoFactorCode !== user.twoFactorSecret) {
      return reply.status(200).send({
        twoFactorRequired: true,
        message: 'Two-factor authentication required. Use code 123456 for demo bypass.',
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
      phone: user.phone,
    };

    const token = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });

    return reply.status(200).send({
      token,
      user: tokenPayload,
      twoFactorBypassed: isBypass,
    });
  });

  // POST /api/auth/verify-2fa
  fastify.post('/verify-2fa', async (request, reply) => {
    const body = (request.body || {}) as { email?: string; code?: string; bypass?: boolean };
    const email = body.email;
    const code = body.code;
    const bypass = body.bypass;

    if (!email) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Email is required' });
    }

    const user = await fastify.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
    }

    if (code === '123456' || bypass || user.demoTwoFactorBypass || code === user.twoFactorSecret) {
      const tokenPayload = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        phone: user.phone,
      };
      const token = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });
      return reply.status(200).send({ token, user: tokenPayload });
    }

    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid 2FA code' });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organization: true,
        phone: true,
        demoTwoFactorBypass: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
    }

    return reply.status(200).send({ user });
  });

  // GET /api/auth/demo-users
  fastify.get('/demo-users', async (_request, reply) => {
    const demoUsers = await fastify.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organization: true,
        phone: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.status(200).send({
      users: demoUsers,
      demoPassword: 'Demo@2026!',
      demo2faCode: '123456',
    });
  });

  // POST /api/auth/demo-switch
  fastify.post('/demo-switch', async (request, reply) => {
    const body = (request.body || {}) as { role?: string };
    if (!body.role) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Target role is required' });
    }

    const user = await fastify.prisma.user.findFirst({
      where: { role: body.role.toUpperCase() },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: `No demo user found for role ${body.role}` });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
      phone: user.phone,
    };

    const token = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });

    return reply.status(200).send({
      token,
      user: tokenPayload,
      message: `Switched to role ${user.role} (${user.fullName})`,
    });
  });
};

type FastPlugin = FastifyPluginAsync;
