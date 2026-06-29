import { prisma } from '../lib/prisma.js'

export const connectDatabase = async () => {
  await prisma.$connect()
  console.log('[db] Prisma conectado a PostgreSQL')
}
