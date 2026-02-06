'use server';

import { NextRequest, NextResponse } from 'next/server';
import { 
  notifyDossierCreated, 
  notifyDocumentUploaded,
  notifyDocumentDeleted,
  notifyCommentAdded,
  notifyAuditCompleted,
  notifyUserLogin,
  notifyProductCreated,
  notifyProductUpdated
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let result;

    switch (type) {
      case 'dossier_created':
        result = await notifyDossierCreated(
          data.dossierName,
          data.userName
        );
        break;

      case 'document_uploaded':
        result = await notifyDocumentUploaded(
          data.documentName,
          data.dossierName,
          data.userName
        );
        break;

      case 'audit_completed':
        result = await notifyAuditCompleted(
          data.dossierName,
          data.result,
          data.userName
        );
        break;

      case 'user_login':
        result = await notifyUserLogin(data.userEmail);
        break;

      case 'product_created':
        result = await notifyProductCreated(
          data.productName,
          data.userName
        );
        break;

      case 'product_updated':
        result = await notifyProductUpdated(
          data.productName,
          data.userName
        );
        break;

      case 'document_deleted':
        result = await notifyDocumentDeleted(
          data.documentName,
          data.dossierName,
          data.userName
        );
        break;

      case 'comment_added':
        result = await notifyCommentAdded(
          data.dossierName,
          data.comment,
          data.userName
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true, id: result.id });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
