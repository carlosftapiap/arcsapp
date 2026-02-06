import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'carlosftapiap@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'ARCSAPP <onboarding@resend.dev>';

export type ActivityType = 
  | 'dossier_created'
  | 'document_uploaded'
  | 'document_deleted'
  | 'comment_added'
  | 'audit_completed'
  | 'user_login'
  | 'product_created'
  | 'product_updated';

interface ActivityNotification {
  type: ActivityType;
  title: string;
  description: string;
  user?: string;
  details?: Record<string, string>;
}

const activityLabels: Record<ActivityType, string> = {
  dossier_created: '📁 Nuevo Dossier Creado',
  document_uploaded: '📄 Documento Subido',
  document_deleted: '🗑️ Documento Eliminado',
  comment_added: '💬 Nuevo Comentario',
  audit_completed: '✅ Auditoría Completada',
  user_login: '🔐 Inicio de Sesión',
  product_created: '🆕 Producto Creado',
  product_updated: '✏️ Producto Actualizado',
};

export async function sendActivityNotification(activity: ActivityNotification) {
  try {
    const detailsHtml = activity.details
      ? Object.entries(activity.details)
          .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
          .join('')
      : '';

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `[ARCSAPP] ${activityLabels[activity.type]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">ARCSAPP</h1>
            <p style="margin: 5px 0 0 0;">Sistema de Gestión Documental</p>
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <h2 style="color: #1e40af; margin-top: 0;">
              ${activityLabels[activity.type]}
            </h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #334155;">${activity.title}</h3>
              <p style="color: #64748b;">${activity.description}</p>
              
              ${activity.user ? `<p><strong>Usuario:</strong> ${activity.user}</p>` : ''}
              ${detailsHtml}
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
              Fecha: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
            </p>
          </div>
          
          <div style="background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Este es un mensaje automático de ARCSAPP</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Evophar</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error };
    }

    console.log('Email notification sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, error };
  }
}

export async function notifyDossierCreated(dossierName: string, userName: string) {
  return sendActivityNotification({
    type: 'dossier_created',
    title: dossierName,
    description: 'Se ha creado un nuevo dossier en el sistema.',
    user: userName,
  });
}

export async function notifyDocumentUploaded(documentName: string, dossierName: string, userName: string) {
  return sendActivityNotification({
    type: 'document_uploaded',
    title: documentName,
    description: `Se ha subido un nuevo documento al dossier "${dossierName}".`,
    user: userName,
    details: {
      'Dossier': dossierName,
    },
  });
}

export async function notifyAuditCompleted(dossierName: string, result: string, userName: string) {
  return sendActivityNotification({
    type: 'audit_completed',
    title: `Auditoría de ${dossierName}`,
    description: 'Se ha completado una auditoría de documentos.',
    user: userName,
    details: {
      'Resultado': result,
    },
  });
}

export async function notifyUserLogin(userEmail: string) {
  return sendActivityNotification({
    type: 'user_login',
    title: 'Nuevo inicio de sesión',
    description: `El usuario ${userEmail} ha iniciado sesión en el sistema.`,
    user: userEmail,
  });
}

export async function notifyProductCreated(productName: string, userName: string) {
  return sendActivityNotification({
    type: 'product_created',
    title: productName,
    description: 'Se ha creado un nuevo producto en el sistema.',
    user: userName,
  });
}

export async function notifyProductUpdated(productName: string, userName: string) {
  return sendActivityNotification({
    type: 'product_updated',
    title: productName,
    description: 'Se ha actualizado un producto en el sistema.',
    user: userName,
  });
}

export async function notifyDocumentDeleted(documentName: string, dossierName: string, userName: string) {
  return sendActivityNotification({
    type: 'document_deleted',
    title: documentName,
    description: `Se ha eliminado un documento del dossier "${dossierName}".`,
    user: userName,
    details: {
      'Dossier': dossierName,
    },
  });
}

export async function notifyCommentAdded(dossierName: string, comment: string, userName: string) {
  return sendActivityNotification({
    type: 'comment_added',
    title: `Comentario en ${dossierName}`,
    description: 'Se ha agregado un nuevo comentario.',
    user: userName,
    details: {
      'Comentario': comment.length > 200 ? comment.substring(0, 200) + '...' : comment,
    },
  });
}
