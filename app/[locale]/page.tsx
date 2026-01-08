import { redirect } from 'next/navigation';

export default function LocalePage() {
    // Redirigir a login
    redirect('./login');
}
