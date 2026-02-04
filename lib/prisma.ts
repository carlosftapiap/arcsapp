import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 10) {
    throw new Error("DATABASE_URL no está definida en el runtime del servidor de Next.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
