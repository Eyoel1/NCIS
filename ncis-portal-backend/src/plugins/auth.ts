import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config/env';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      organization?: string | null;
      phone?: string | null;
    };
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      organization?: string | null;
      phone?: string | null;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (allowedRoles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPluginFn(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // 1. Check for demo header impersonation
    const demoRole = request.headers['x-demo-role'] as string | undefined;
    if (demoRole) {
      const demoUser = await fastify.prisma.user.findFirst({
        where: { role: demoRole.toUpperCase() },
      });
      if (demoUser) {
        request.user = {
          id: demoUser.id,
          email: demoUser.email,
          fullName: demoUser.fullName,
          role: demoUser.role,
          organization: demoUser.organization,
          phone: demoUser.phone,
        };
        return;
      }
    }

    // 2. Standard JWT verification
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or missing authentication token' });
    }
  };

  const requireRole = (allowedRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await authenticate(request, reply);
      if (!request.user) return;
      if (request.user.role === 'SUPER_ADMIN') return;
      if (!allowedRoles.includes(request.user.role)) {
        reply.status(403).send({
          error: 'Forbidden',
          message: `Access denied. Allowed roles: [${allowedRoles.join(', ')}]. Current role: ${request.user.role}`,
        });
      }
    };
  };

  fastify.decorate('authenticate', authenticate);
  fastify.decorate('requireRole', requireRole);
}

export const authPlugin = fp(authPluginFn, { name: 'auth-plugin', dependencies: ['prisma-plugin'] });
