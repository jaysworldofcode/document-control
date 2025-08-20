export interface Document {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  version: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  lastModifiedBy: string;
  sharePointPath: string;
  description?: string;
  tags: string[];
  projectId: string;
  customFieldValues: Record<string, any>;
  checkoutInfo?: {
    checkedOutBy: string;
    checkedOutAt: string;
    reason?: string;
  };
  approvalWorkflow?: {
    id: string;
    currentStep: number;
    totalSteps: number;
    overallStatus: 'pending' | 'under-review' | 'approved' | 'rejected';
    steps: {
      id: string;
      approverId: string;
      approverName: string;
      approverEmail: string;
      department: string;
      order: number;
      status: 'pending' | 'under-review' | 'approved' | 'rejected';
      approvedAt?: string;
      rejectedAt?: string;
      comments?: string;
      viewedDocument?: boolean;
      downloadedDocument?: boolean;
      openedInSharePoint?: boolean;
    }[];
    requestedBy: string;
    requestedAt: string;
    completedAt?: string;
  };
  revisionHistory: DocumentRevision[];
}

export interface DocumentRevision {
  id: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  changes: string;
  filePath: string;
}

export type DocumentStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'archived' 
  | 'checked_out'
  | 'final';

export interface DocumentFilter {
  status?: DocumentStatus[];
  fileType?: string[];
  uploadedBy?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
}

export interface DocumentUploadData {
  file: File;
  description?: string;
  tags: string[];
  customFieldValues: Record<string, any>;
}
