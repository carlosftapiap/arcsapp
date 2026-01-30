
import prisma from '@/lib/prisma';

export default async function DiagnosticPage() {
    // 1. Get all unique user IDs from content
    const docs = await prisma.documents.findMany({ select: { uploaded_by: true } });
    const dossiers = await prisma.dossiers.findMany({ select: { created_by: true } });

    const uploaderIds = new Set(docs.map(d => d.uploaded_by).filter(Boolean) as string[]);
    const creatorIds = new Set(dossiers.map(d => d.created_by).filter(Boolean) as string[]);

    const allIds = Array.from(new Set([...uploaderIds, ...creatorIds]));

    // 2. Find existing profiles
    const profiles = await prisma.profiles.findMany({
        where: { user_id: { in: allIds } },
        select: { user_id: true, full_name: true, email: true }
    });

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));

    // 3. Identify missing
    const missingIds = allIds.filter(id => !profileMap.has(id));

    // 4. Get Auth User details for missing profiles
    let missingUsersDetails = [];
    if (missingIds.length > 0) {
        missingUsersDetails = await prisma.users.findMany({
            where: { id: { in: missingIds } },
            select: { id: true, email: true, created_at: true }
        });
    }

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico de Usuarios</h1>

            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h2 className="font-bold text-lg mb-2 text-yellow-800">Usuarios sin Perfil (Causa de "Usuario" genérico)</h2>
                {missingUsersDetails.length === 0 ? (
                    <p className="text-green-600">¡Todos los usuarios activos tienen perfil!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-2 text-left">ID (Auth)</th>
                                    <th className="p-2 text-left">Email</th>
                                    <th className="p-2 text-left">Creado</th>
                                    <th className="p-2 text-left">Acción SQL Sugerida</th>
                                </tr>
                            </thead>
                            <tbody>
                                {missingUsersDetails.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-mono text-xs">{u.id}</td>
                                        <td className="p-2">{u.email}</td>
                                        <td className="p-2 text-sm">{u.created_at?.toString()}</td>
                                        <td className="p-2 font-mono text-xs bg-gray-50 p-2 block w-[400px] overflow-x-auto">
                                            INSERT INTO public.profiles (user_id, email, full_name) VALUES ('{u.id}', '{u.email}', 'Nombre Aquí');
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded opacity-50">
                <h2 className="font-bold text-lg mb-2 text-green-800">Perfiles Correctos ({profiles.length})</h2>
                <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(profiles, null, 2)}
                </pre>
            </div>
        </div>
    );
}
