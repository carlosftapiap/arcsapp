const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function main() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('No database URL found in environment');
        process.exit(1);
    }

    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = fs.readFileSync('./supabase/migrations/20260131_corporate_docs_template.sql', 'utf8');
        console.log('Executing SQL migration...');

        await client.query(sql);

        console.log('✅ Migration applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
