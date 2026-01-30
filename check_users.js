
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Documents Uploaders ---');
    try {
        const docs = await prisma.documents.findMany({
            select: { uploaded_by: true, id: true },
            take: 50
        });
        console.log('Docs (sample):', docs.length);
        const uploaderIds = [...new Set(docs.map(d => d.uploaded_by).filter(Boolean))];
        console.log('Unique Uploader IDs in Documents:', uploaderIds);

        if (uploaderIds.length > 0) {
            console.log('Checking Profiles for these IDs...');
            const profiles = await prisma.profiles.findMany({
                where: { user_id: { in: uploaderIds } },
                select: { user_id: true, full_name: true }
            });
            console.log('Found Profiles:', profiles);

            const missing = uploaderIds.filter(id => !profiles.find(p => p.user_id === id));
            if (missing.length > 0) {
                console.log('MISSING PROFILES:', missing);

                console.log('Checking Auth Users for missing IDs...');
                // Try to find them in auth.users
                const users = await prisma.users.findMany({
                    where: { id: { in: missing } },
                    select: { id: true, email: true }
                });
                console.log('Auth Users found for missing profiles:', users);
            } else {
                console.log('All document uploaders have profiles.');
            }
        }
    } catch (e) {
        console.error('Error querying documents/profiles:', e);
    }

    console.log('--- Checking Auth Users Table ---');
    try {
        const users = await prisma.users.findMany({
            take: 10,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                email: true,
                created_at: true,
            }
        })
        console.table(users)
    } catch (e) {
        console.error('Error querying users:', e);
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
