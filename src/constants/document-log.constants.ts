import { DocumentLog, DocumentLogAction } from "@/types/document-log.types";

// Generate mock logs for each document
export const MOCK_DOCUMENT_LOGS: DocumentLog[] = [
  // Document 1 logs (doc-001)
  {
    id: "log-001",
    documentId: "doc-001",
    action: "upload",
    timestamp: "2024-12-15T09:00:00Z",
    userId: "user-001",
    userName: "John Doe",
    details: {
      description: "Initial upload of Project Charter document",
      version: "1.0",
      fileName: "Project_Charter_V1.0.pdf",
      fileSize: 2457600
    }
  },
  {
    id: "log-002",
    documentId: "doc-001",
    action: "view",
    timestamp: "2024-12-15T10:30:00Z",
    userId: "user-002",
    userName: "Jane Smith",
    details: {
      description: "Viewed document for review",
      version: "1.0"
    }
  },
  {
    id: "log-003",
    documentId: "doc-001",
    action: "status_change",
    timestamp: "2024-12-15T11:15:00Z",
    userId: "user-002",
    userName: "Jane Smith",
    details: {
      description: "Status changed from Draft to Pending Review",
      oldValue: "draft",
      newValue: "pending_review"
    }
  },
  {
    id: "log-004",
    documentId: "doc-001",
    action: "download",
    timestamp: "2024-12-15T14:20:00Z",
    userId: "user-003",
    userName: "Mike Johnson",
    details: {
      description: "Downloaded document for offline review",
      version: "1.0",
      fileName: "Project_Charter_V1.0.pdf"
    }
  },
  {
    id: "log-005",
    documentId: "doc-001",
    action: "approval",
    timestamp: "2024-12-16T09:45:00Z",
    userId: "user-002",
    userName: "Jane Smith",
    details: {
      description: "Document approved by project manager",
      oldValue: "pending_review",
      newValue: "approved",
      reason: "Document meets all requirements and standards"
    }
  },

  // Document 2 logs (doc-002)
  {
    id: "log-006",
    documentId: "doc-002",
    action: "upload",
    timestamp: "2024-12-14T08:30:00Z",
    userId: "user-001",
    userName: "John Doe",
    details: {
      description: "Uploaded system requirements document",
      version: "1.0",
      fileName: "System_Requirements.docx",
      fileSize: 1048576
    }
  },
  {
    id: "log-007",
    documentId: "doc-002",
    action: "checkout",
    timestamp: "2024-12-14T15:00:00Z",
    userId: "user-004",
    userName: "Sarah Wilson",
    details: {
      description: "Checked out document for editing",
      reason: "Adding additional technical specifications"
    }
  },
  {
    id: "log-008",
    documentId: "doc-002",
    action: "checkin",
    timestamp: "2024-12-15T11:30:00Z",
    userId: "user-004",
    userName: "Sarah Wilson",
    details: {
      description: "Checked in document with updates",
      version: "1.1"
    }
  },
  {
    id: "log-009",
    documentId: "doc-002",
    action: "version_upload",
    timestamp: "2024-12-15T11:35:00Z",
    userId: "user-004",
    userName: "Sarah Wilson",
    details: {
      description: "Uploaded new version with technical specifications",
      version: "1.1",
      fileName: "System_Requirements_V1.1.docx",
      fileSize: 1200000
    }
  },
  {
    id: "log-010",
    documentId: "doc-002",
    action: "view",
    timestamp: "2024-12-15T16:45:00Z",
    userId: "user-005",
    userName: "David Brown",
    details: {
      description: "Reviewed updated requirements",
      version: "1.1"
    }
  },

  // Document 3 logs (doc-003)
  {
    id: "log-011",
    documentId: "doc-003",
    action: "upload",
    timestamp: "2024-12-13T10:15:00Z",
    userId: "user-006",
    userName: "Emily Davis",
    details: {
      description: "Initial upload of design mockups",
      version: "1.0",
      fileName: "Design_Mockups.pdf",
      fileSize: 8388608
    }
  },
  {
    id: "log-012",
    documentId: "doc-003",
    action: "view",
    timestamp: "2024-12-13T14:30:00Z",
    userId: "user-001",
    userName: "John Doe",
    details: {
      description: "Reviewed design concepts",
      version: "1.0"
    }
  },
  {
    id: "log-013",
    documentId: "doc-003",
    action: "comment",
    timestamp: "2024-12-13T15:00:00Z",
    userId: "user-001",
    userName: "John Doe",
    details: {
      description: "Added feedback on design direction",
      reason: "Suggested color scheme adjustments for better accessibility"
    }
  },
  {
    id: "log-014",
    documentId: "doc-003",
    action: "status_change",
    timestamp: "2024-12-14T09:00:00Z",
    userId: "user-006",
    userName: "Emily Davis",
    details: {
      description: "Status changed to Under Review",
      oldValue: "draft",
      newValue: "under_review"
    }
  },
  {
    id: "log-015",
    documentId: "doc-003",
    action: "download",
    timestamp: "2024-12-14T11:20:00Z",
    userId: "user-007",
    userName: "Alex Chen",
    details: {
      description: "Downloaded for stakeholder presentation",
      version: "1.0",
      fileName: "Design_Mockups.pdf"
    }
  },

  // Document 4 logs (doc-004)
  {
    id: "log-016",
    documentId: "doc-004",
    action: "upload",
    timestamp: "2024-12-12T13:45:00Z",
    userId: "user-008",
    userName: "Lisa Garcia",
    details: {
      description: "Uploaded meeting minutes",
      version: "1.0",
      fileName: "Weekly_Meeting_Minutes.docx",
      fileSize: 524288
    }
  },
  {
    id: "log-017",
    documentId: "doc-004",
    action: "edit",
    timestamp: "2024-12-12T16:30:00Z",
    userId: "user-008",
    userName: "Lisa Garcia",
    details: {
      description: "Corrected action items and attendee list",
      version: "1.0"
    }
  },
  {
    id: "log-018",
    documentId: "doc-004",
    action: "share",
    timestamp: "2024-12-13T08:00:00Z",
    userId: "user-008",
    userName: "Lisa Garcia",
    details: {
      description: "Shared with all project stakeholders",
      reason: "Distribution of weekly meeting outcomes"
    }
  },
  {
    id: "log-019",
    documentId: "doc-004",
    action: "view",
    timestamp: "2024-12-13T09:15:00Z",
    userId: "user-001",
    userName: "John Doe",
    details: {
      description: "Reviewed meeting minutes",
      version: "1.0"
    }
  },
  {
    id: "log-020",
    documentId: "doc-004",
    action: "view",
    timestamp: "2024-12-13T10:30:00Z",
    userId: "user-002",
    userName: "Jane Smith",
    details: {
      description: "Reviewed action items",
      version: "1.0"
    }
  },

  // Document 5 logs (doc-005)
  {
    id: "log-021",
    documentId: "doc-005",
    action: "upload",
    timestamp: "2024-12-11T11:00:00Z",
    userId: "user-009",
    userName: "Robert Taylor",
    details: {
      description: "Uploaded budget analysis spreadsheet",
      version: "1.0",
      fileName: "Budget_Analysis.xlsx",
      fileSize: 2097152
    }
  },
  {
    id: "log-022",
    documentId: "doc-005",
    action: "checkout",
    timestamp: "2024-12-12T09:30:00Z",
    userId: "user-010",
    userName: "Michelle Lee",
    details: {
      description: "Checked out for financial review",
      reason: "Updating Q4 projections"
    }
  },
  {
    id: "log-023",
    documentId: "doc-005",
    action: "checkin",
    timestamp: "2024-12-12T17:45:00Z",
    userId: "user-010",
    userName: "Michelle Lee",
    details: {
      description: "Checked in with updated projections",
      version: "1.1"
    }
  },
  {
    id: "log-024",
    documentId: "doc-005",
    action: "status_change",
    timestamp: "2024-12-13T08:15:00Z",
    userId: "user-009",
    userName: "Robert Taylor",
    details: {
      description: "Status changed to Pending Review",
      oldValue: "draft",
      newValue: "pending_review"
    }
  },
  {
    id: "log-025",
    documentId: "doc-005",
    action: "rejection",
    timestamp: "2024-12-14T10:00:00Z",
    userId: "user-011",
    userName: "Kevin Wilson",
    details: {
      description: "Document rejected due to incomplete data",
      oldValue: "pending_review",
      newValue: "rejected",
      reason: "Missing expense breakdowns for Q3"
    }
  },

  // Additional logs for more recent activity
  {
    id: "log-026",
    documentId: "doc-001",
    action: "view",
    timestamp: "2024-12-16T14:30:00Z",
    userId: "user-012",
    userName: "Amanda Clark",
    details: {
      description: "Accessed approved document for implementation",
      version: "1.0"
    }
  },
  {
    id: "log-027",
    documentId: "doc-002",
    action: "download",
    timestamp: "2024-12-16T16:00:00Z",
    userId: "user-001",
    userName: "John Doe",
    details: {
      description: "Downloaded latest requirements for development",
      version: "1.1",
      fileName: "System_Requirements_V1.1.docx"
    }
  }
];

// Helper function to get logs for a specific document
export const getDocumentLogs = (documentId: string): DocumentLog[] => {
  return MOCK_DOCUMENT_LOGS.filter(log => log.documentId === documentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Helper function to get recent logs across all documents
export const getRecentLogs = (limit: number = 10): DocumentLog[] => {
  return MOCK_DOCUMENT_LOGS
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

// Log action configuration for display
export const LOG_ACTION_CONFIG: Record<DocumentLogAction, { 
  label: string; 
  icon: string; 
  color: string;
  description: string;
}> = {
  upload: {
    label: "Upload",
    icon: "📤",
    color: "text-blue-600",
    description: "Document was uploaded"
  },
  download: {
    label: "Download",
    icon: "📥",
    color: "text-green-600",
    description: "Document was downloaded"
  },
  view: {
    label: "View",
    icon: "👁️",
    color: "text-gray-600",
    description: "Document was viewed"
  },
  edit: {
    label: "Edit",
    icon: "✏️",
    color: "text-orange-600",
    description: "Document was edited"
  },
  status_change: {
    label: "Status Change",
    icon: "🔄",
    color: "text-purple-600",
    description: "Document status was changed"
  },
  checkout: {
    label: "Check Out",
    icon: "🔒",
    color: "text-yellow-600",
    description: "Document was checked out"
  },
  checkin: {
    label: "Check In",
    icon: "🔓",
    color: "text-yellow-600",
    description: "Document was checked in"
  },
  approval: {
    label: "Approval",
    icon: "✅",
    color: "text-green-600",
    description: "Document was approved"
  },
  rejection: {
    label: "Rejection",
    icon: "❌",
    color: "text-red-600",
    description: "Document was rejected"
  },
  version_upload: {
    label: "Version Upload",
    icon: "📋",
    color: "text-blue-600",
    description: "New version was uploaded"
  },
  share: {
    label: "Share",
    icon: "🔗",
    color: "text-indigo-600",
    description: "Document was shared"
  },
  comment: {
    label: "Comment",
    icon: "💬",
    color: "text-gray-600",
    description: "Comment was added"
  },
  delete: {
    label: "Delete",
    icon: "🗑️",
    color: "text-red-600",
    description: "Document was deleted"
  },
  restore: {
    label: "Restore",
    icon: "♻️",
    color: "text-green-600",
    description: "Document was restored"
  },
  move: {
    label: "Move",
    icon: "📁",
    color: "text-blue-600",
    description: "Document was moved"
  },
  copy: {
    label: "Copy",
    icon: "📄",
    color: "text-gray-600",
    description: "Document was copied"
  },
  approved: {
    label: "Approved",
    icon: "✅",
    color: "text-green-600",
    description: "Document was approved in workflow"
  },
  rejected: {
    label: "Rejected",
    icon: "❌",
    color: "text-red-600",
    description: "Document was rejected in workflow"
  }
};
