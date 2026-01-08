import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    return handleSignOut();
}

export async function POST() {
    return handleSignOut();
}

async function handleSignOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Clear cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
        cookieStore.delete(cookie.name);
    });

    return NextResponse.redirect(new URL('/es/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
