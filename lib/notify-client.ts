type NotificationType = 
  | 'dossier_created'
  | 'document_uploaded'
  | 'document_deleted'
  | 'comment_added'
  | 'audit_completed'
  | 'user_login'
  | 'product_created'
  | 'product_updated';

interface NotifyData {
  dossierName?: string;
  documentName?: string;
  productName?: string;
  userName?: string;
  userEmail?: string;
  result?: string;
  comment?: string;
}

export async function sendNotification(type: NotificationType, data: NotifyData) {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      console.error('Failed to send notification');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function notifyDossierCreated(dossierName: string, userName: string) {
  return sendNotification('dossier_created', { dossierName, userName });
}

export async function notifyDocumentUploaded(documentName: string, dossierName: string, userName: string) {
  return sendNotification('document_uploaded', { documentName, dossierName, userName });
}

export async function notifyAuditCompleted(dossierName: string, result: string, userName: string) {
  return sendNotification('audit_completed', { dossierName, result, userName });
}

export async function notifyUserLogin(userEmail: string) {
  return sendNotification('user_login', { userEmail });
}

export async function notifyProductCreated(productName: string, userName: string) {
  return sendNotification('product_created', { productName, userName });
}

export async function notifyProductUpdated(productName: string, userName: string) {
  return sendNotification('product_updated', { productName, userName });
}

export async function notifyDocumentDeleted(documentName: string, dossierName: string, userName: string) {
  return sendNotification('document_deleted', { documentName, dossierName, userName });
}

export async function notifyCommentAdded(dossierName: string, comment: string, userName: string) {
  return sendNotification('comment_added', { dossierName, comment, userName });
}
