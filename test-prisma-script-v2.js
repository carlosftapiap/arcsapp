const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
    try {
        fs.writeFileSync('log.txt', 'Starting...\n');
        console.log('Connecting...');
        const count = await prisma.dossiers.count();
        fs.appendFileSync('log.txt', `Success! Count: ${count}\n`);
        console.log('Success! Count:', count);
    } catch (e) {
        fs.appendFileSync('log.txt', `Error: ${e.message}\n${e.stack}\n`);
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
