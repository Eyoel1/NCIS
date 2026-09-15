import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prisma = new PrismaClient();

async function prismaPluginFn(fastify: FastifyInstance) {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}

export const prismaPlugin = fp(prismaPluginFn, { name: 'prisma-plugin' });
