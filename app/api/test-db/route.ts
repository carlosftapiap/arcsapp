import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Attempt to query the database. Using a public table 'dossiers'.
        // If auth schema tables are present, we could check them too, but 'dossiers' is safer.
        const count = await prisma.dossiers.count();
        return NextResponse.json({ success: true, count, message: 'Prisma Client is connected and working!' });
    } catch (error) {
        console.error('Prisma connection error:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
