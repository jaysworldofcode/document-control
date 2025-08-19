import { DocumentStatus } from "./document.types";

export interface DocumentLog {
  id: string;
  documentId: string;
  action: DocumentLogAction;
  timestamp: string;
  userId: string;
  userName: string;
  details: DocumentLogDetails;
  metadata?: Record<string, any>;
}

export type DocumentLogAction = 
  | 'upload'
  | 'download'
  | 'view'
  | 'edit'
  | 'status_change'
  | 'checkout'
  | 'checkin'
  | 'approval'
  | 'rejection'
  | 'version_upload'
  | 'share'
  | 'comment'
  | 'delete'
  | 'restore'
  | 'move'
  | 'copy';

export interface DocumentLogDetails {
  description: string;
  oldValue?: any;
  newValue?: any;
  version?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  fileSize?: number;
  fileName?: string;
}

export interface DocumentLogFilter {
  actions?: DocumentLogAction[];
  users?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}
