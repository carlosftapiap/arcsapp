'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendActivityNotification } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Enviar email de prueba
    const result = await sendActivityNotification({
      type: 'document_uploaded',
      title: 'Documento de Prueba',
      description: 'Este es un email de prueba para verificar que las notificaciones funcionan correctamente.',
      user: 'Sistema de Prueba',
      details: {
        'Dossier': 'Dossier de Ejemplo',
        'Tipo': 'Email de Test',
        'Estado': 'Funcionando ✅',
      },
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email de prueba enviado correctamente',
        id: result.id 
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Error al enviar email de prueba' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
