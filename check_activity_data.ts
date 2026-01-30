
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Checking recent documents...');
    const recentDocs = await prisma.documents.findMany({
        take: 5,
        orderBy: { uploaded_at: 'desc' },
        include: {
            profiles: true
        }
    });

    console.log(`Found ${recentDocs.length} documents.`);

    for (const doc of recentDocs) {
        console.log('---------------------------------------------------');
        console.log(`Doc ID: ${doc.id}`);
        console.log(`Uploaded By (ID): ${doc.uploaded_by}`);
        console.log(`Profile:`, doc.profiles);

        if (doc.uploaded_by) {
            const profile = await prisma.profiles.findUnique({
                where: { user_id: doc.uploaded_by }
            });
            console.log(`Direct Profile Fetch:`, profile);
        }
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
