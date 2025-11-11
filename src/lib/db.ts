import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaSingleton: PrismaClient | undefined;
}

const prisma = globalThis.prismaSingleton ?? new PrismaClient({});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaSingleton = prisma;
}

export { prisma };


