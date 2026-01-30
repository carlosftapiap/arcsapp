
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Connecting...');
        const count = await prisma.dossiers.count();
        console.log('Success! Count:', count);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
