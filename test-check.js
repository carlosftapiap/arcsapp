const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
    fs.writeFileSync('check.txt', 'Start\n');
    try {
        fs.appendFileSync('check.txt', `Type of PrismaClient: ${typeof PrismaClient}\n`);
        const prisma = new PrismaClient({});
        fs.appendFileSync('check.txt', 'Instantiated with empty object\n');
        await prisma.$connect();
        fs.appendFileSync('check.txt', 'Connected\n');
    } catch (e) {
        fs.appendFileSync('check.txt', `Error: ${e.message}\n`);
    }
}
main();
