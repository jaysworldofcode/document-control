export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  replyTo?: string; // ID of parent comment for replies
  attachments?: CommentAttachment[];
  reactions?: CommentReaction[];
}

export interface CommentAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface CommentReaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'love' | 'helpful' | 'approve' | 'reject';
  createdAt: string;
}

export interface NewCommentData {
  content: string;
  replyTo?: string;
  attachments?: File[];
}

export interface DocumentRejectionInfo {
  rejectedBy: string;
  rejectedAt: string;
  reason: string;
  attachments?: CommentAttachment[];
  step?: {
    id: string;
    approverId: string;
    approverName: string;
    department: string;
  };
}
