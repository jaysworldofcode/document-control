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
    currentStep: string;
    approvers: ApprovalStep[];
    status: ApprovalStatus;
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

export interface ApprovalStep {
  id: string;
  approverName: string;
  approverEmail: string;
  step: number;
  status: ApprovalStatus;
  approvedAt?: string;
  comments?: string;
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

export type ApprovalStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'skipped';

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
