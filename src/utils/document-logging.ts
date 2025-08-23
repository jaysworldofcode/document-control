import { DocumentLogAction } from '@/types/document-log.types';

export interface DocumentLogData {
  action: DocumentLogAction;
  description: string;
  details?: {
    oldValue?: any;
    newValue?: any;
    version?: string;
    reason?: string;
    fileSize?: number;
    fileName?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Log a document activity to the system
 * @param documentId - The ID of the document
 * @param logData - The log data to record
 * @returns Promise<boolean> - Success status
 */
export async function logDocumentActivity(
  documentId: string, 
  logData: DocumentLogData
): Promise<boolean> {
  try {
    // Check if we're on the client side
    const isClient = typeof window !== 'undefined';
    const baseUrl = isClient ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/documents/${documentId}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      console.error('Failed to log document activity:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging document activity:', error);
    return false;
  }
}

/**
 * Predefined logging functions for common actions
 */
export const documentLogging = {
  // Document viewing
  logView: (documentId: string, version?: string) => 
    logDocumentActivity(documentId, {
      action: 'view',
      description: 'Document viewed',
      details: { version }
    }),

  // Document download
  logDownload: (documentId: string, version?: string, fileName?: string, fileSize?: number) => 
    logDocumentActivity(documentId, {
      action: 'download',
      description: 'Document downloaded',
      details: { version, fileName, fileSize }
    }),

  // Document edit
  logEdit: (documentId: string, version?: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'edit',
      description: 'Document edited',
      details: { version, reason }
    }),

  // Status changes
  logStatusChange: (documentId: string, oldStatus: string, newStatus: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'status_change',
      description: `Document status changed from ${oldStatus} to ${newStatus}`,
      details: { oldValue: oldStatus, newValue: newStatus, reason }
    }),

  // Document upload
  logUpload: (documentId: string, version: string, fileName: string, fileSize: number) => 
    logDocumentActivity(documentId, {
      action: 'upload',
      description: 'Document uploaded',
      details: { version, fileName, fileSize }
    }),

  // Version upload
  logVersionUpload: (documentId: string, version: string, fileName: string, fileSize: number) => 
    logDocumentActivity(documentId, {
      action: 'version_upload',
      description: 'New document version uploaded',
      details: { version, fileName, fileSize }
    }),

  // Document checkout
  logCheckout: (documentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'checkout',
      description: 'Document checked out',
      details: { reason }
    }),

  // Document checkin
  logCheckin: (documentId: string, version?: string) => 
    logDocumentActivity(documentId, {
      action: 'checkin',
      description: 'Document checked in',
      details: { version }
    }),

  // Document approval
  logApproval: (documentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'approval',
      description: 'Document approved',
      details: { reason }
    }),

  // Document rejection
  logRejection: (documentId: string, reason: string) => 
    logDocumentActivity(documentId, {
      action: 'rejection',
      description: 'Document rejected',
      details: { reason }
    }),

  // Document sharing
  logShare: (documentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'share',
      description: 'Document shared',
      details: { reason }
    }),

  // Document commenting
  logComment: (documentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'comment',
      description: 'Comment added to document',
      details: { reason }
    }),

  // Document deletion
  logDelete: (documentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'delete',
      description: 'Document deleted',
      details: { reason }
    }),

  // Document restoration
  logRestore: (documentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'restore',
      description: 'Document restored',
      details: { reason }
    }),

  // Document move
  logMove: (documentId: string, oldLocation: string, newLocation: string) => 
    logDocumentActivity(documentId, {
      action: 'move',
      description: `Document moved from ${oldLocation} to ${newLocation}`,
      details: { oldValue: oldLocation, newValue: newLocation }
    }),

  // Document copy
  logCopy: (documentId: string, newDocumentId: string, reason?: string) => 
    logDocumentActivity(documentId, {
      action: 'copy',
      description: 'Document copied',
      details: { newValue: newDocumentId, reason }
    }),
};

/**
 * Automatic logging decorator for functions
 * Usage: @withDocumentLogging('view', 'Document viewed')
 */
export function withDocumentLogging(
  action: DocumentLogAction,
  description: string | ((...args: any[]) => string)
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Try to extract documentId from args or result
      let documentId: string | undefined;
      if (args.length > 0 && typeof args[0] === 'string') {
        documentId = args[0];
      } else if (result && result.documentId) {
        documentId = result.documentId;
      }

      if (documentId) {
        const desc = typeof description === 'function' ? description(...args) : description;
        await logDocumentActivity(documentId, {
          action,
          description: desc
        });
      }

      return result;
    };

    return descriptor;
  };
}
