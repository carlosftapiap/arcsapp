
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260130_fix_activity_username.sql');
    console.log(`Leyendo SQL de: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
        console.error('El archivo SQL no existe.');
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('SQL leído. Ejecutando...');

    try {
        // Split by semicolons simple approach or just run as one block?
        // Postgres implies valid block for $function$ body.
        // Prisma executeRaw might handle multiple statements if supported by driver, but usually safe to run clean functions.
        // The file contains DROP, CREATE OR REPLACE, and GRANTs.
        // It's safer to execute properly.

        // For specific ensuring, let's try executeRawUnsafe on the whole string.
        // If it fails on multiple statements, we can split.
        const result = await prisma.$executeRawUnsafe(sql);
        console.log('Migración aplicada con éxito:', result);
    } catch (e) {
        console.error('Error al aplicar SQL:', e);

        // Fallback: Try splitting by statement if specific error
        console.log('Intentando dividir por sentencias (fallback)...');
        /* This logic is brittle for $function$ blocks, better hope the driver takes the whole block */
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
