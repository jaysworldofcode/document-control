export interface RejectionAttachment {
  id: string;
  step_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  downloadUrl?: string;
}

export interface ApprovalStep {
  id: string;
  approver: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  step_order: number;
  comments?: string;
  approved_at?: string;
  rejected_at?: string;
  viewed_document: boolean;
  attachments?: RejectionAttachment[];
}

export interface ApprovalWorkflow {
  id: string;
  document_id: string;
  current_step: number;
  total_steps: number;
  overall_status: 'pending' | 'under-review' | 'approved' | 'rejected';
  document_approval_steps: ApprovalStep[];
}
