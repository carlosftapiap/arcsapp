const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
    console.error('DATABASE_URL or DIRECT_URL not found in env');
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});
async function main() {
    try {
        const t = await prisma.$queryRaw`SELECT * FROM checklist_templates WHERE product_type = 'corporate_docs'`;
        console.log('Template check result:', t);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
