import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 10) {
    throw new Error("DATABASE_URL no está definida en el runtime del servidor de Next.")
}

const prismaClientSingleton = () => {
    return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
