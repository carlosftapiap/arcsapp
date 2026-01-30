const fs = require('fs');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
    // Explicitly pass url if environment variable is tricky
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    console.log('DEBUG: URL available?', !!url);
    if (url) console.log('DEBUG: URL starts with', url.substring(0, 10));

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
    });
    try {
        console.log('Reading migration file...');
        const sql = fs.readFileSync('./supabase/migrations/20260131_corporate_docs_template.sql', 'utf8');

        console.log('Executing migration...');

        // Split SQL manually, respecting $function$ blocks is hard with regex.
        // But the file structure is known: DROP; CREATE; GRANT; GRANT;
        // Let's try splitting by ";\r\n" or ";\n" but avoiding inside $function$
        // Actually, $function$ ... $function$; ends with ; too.

        // A simple split by ";\n" might work if the formatting is clean.
        // Let's assume the file is formatted with statements ending with ; followed by newline.

        const statements = sql
            .split(/;\s*[\r\n]+/)
            .filter(s => s.trim().length > 0);

        for (const statement of statements) {
            console.log('Executing statement (truncated):', statement.substring(0, 50) + '...');
            await prisma.$executeRawUnsafe(statement);
        }

        console.log('Migration applied successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
