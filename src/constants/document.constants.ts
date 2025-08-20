import { Document } from "@/types/document.types";

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc-001",
    name: "System Architecture Document",
    fileName: "system_architecture_v2.1.pdf",
    fileType: "pdf",
    fileSize: 2450000,
    version: "2.1",
    status: "approved",
    uploadedBy: "John Doe",
    uploadedAt: "2024-08-15T10:30:00Z",
    lastModified: "2024-08-15T10:30:00Z",
    lastModifiedBy: "John Doe",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Architecture/system_architecture_v2.1.pdf",
    description: "Complete system architecture documentation for DMS v2.0",
    tags: ["architecture", "technical", "system-design"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Technical Specification",
      "security-level": "Confidential"
    },
    approvalWorkflow: {
      id: "workflow-001",
      currentStep: 2,
      totalSteps: 2,
      overallStatus: "approved",
      requestedBy: "john.doe@techcorp.com",
      requestedAt: "2024-08-14T10:00:00Z",
      completedAt: "2024-08-15T09:15:00Z",
      steps: [
        {
          id: "ap-001",
          approverId: "user_001",
          approverName: "Sarah Wilson",
          approverEmail: "sarah.wilson@techcorp.com",
          department: "Architecture",
          order: 1,
          status: "approved",
          approvedAt: "2024-08-14T14:20:00Z",
          comments: "Architecture looks solid. Approved for implementation."
        }
      ]
    },
    revisionHistory: [
      {
        id: "rev-001",
        version: "1.0",
        uploadedBy: "John Doe",
        uploadedAt: "2024-08-12T09:00:00Z",
        changes: "Initial architecture draft",
        filePath: "/TechCorp/Projects/DMS-v2/Architecture/system_architecture_v1.0.pdf"
      }
    ]
  },
  {
    id: "doc-002",
    name: "User Interface Mockups",
    fileName: "ui_mockups_v2.0.figma",
    fileType: "figma",
    fileSize: 15600000,
    version: "2.0",
    status: "under_review",
    uploadedBy: "Jane Smith",
    uploadedAt: "2024-08-05T09:00:00Z",
    lastModified: "2024-08-06T16:45:00Z",
    lastModifiedBy: "Jane Smith",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_v2.0.figma",
    description: "Complete UI/UX mockups for the Document Management System",
    tags: ["design", "ui", "ux", "mockups"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Design Document",
      "design-stage": "High Fidelity"
    },
    approvalWorkflow: {
      id: "workflow-002",
      currentStep: 1,
      totalSteps: 2,
      overallStatus: "pending",
      requestedBy: "jane.smith@techcorp.com",
      requestedAt: "2024-08-05T09:00:00Z",
      steps: [
        {
          id: "ap-003",
          approverId: "user_003",
          approverName: "Mike Johnson",
          approverEmail: "mike.johnson@techcorp.com",
          department: "Design",
          order: 1,
          status: "pending"
        }
      ]
    },
    revisionHistory: [
      {
        id: "rev-004",
        version: "1.0",
        uploadedBy: "Jane Smith",
        uploadedAt: "2024-08-05T09:00:00Z",
        changes: "Initial mockup designs",
        filePath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_v1.0.figma"
      }
    ]
  }
];

export const DOCUMENT_STATUS_CONFIG = {
  draft: { 
    label: "Draft", 
    variant: "secondary" as const, 
    description: "Document is being created or edited" 
  },
  pending_review: { 
    label: "Pending Review", 
    variant: "warning" as const, 
    description: "Waiting for review to start" 
  },
  under_review: { 
    label: "Under Review", 
    variant: "info" as const, 
    description: "Currently being reviewed" 
  },
  approved: { 
    label: "Approved", 
    variant: "success" as const, 
    description: "Document has been approved" 
  },
  rejected: { 
    label: "Rejected", 
    variant: "destructive" as const, 
    description: "Document was rejected and needs revision" 
  },
  archived: { 
    label: "Archived", 
    variant: "secondary" as const, 
    description: "Document is archived and no longer active" 
  },
  checked_out: { 
    label: "Checked Out", 
    variant: "warning" as const, 
    description: "Document is currently checked out for editing" 
  },
  final: { 
    label: "Final", 
    variant: "success" as const, 
    description: "Final version of the document" 
  }
};

export const FILE_TYPE_CONFIG = {
  pdf: { icon: "FileText", color: "text-red-600" },
  doc: { icon: "FileText", color: "text-blue-600" },
  docx: { icon: "FileText", color: "text-blue-600" },
  xls: { icon: "FileSpreadsheet", color: "text-green-600" },
  xlsx: { icon: "FileSpreadsheet", color: "text-green-600" },
  ppt: { icon: "Presentation", color: "text-orange-600" },
  pptx: { icon: "Presentation", color: "text-orange-600" },
  txt: { icon: "FileText", color: "text-gray-600" },
  md: { icon: "FileText", color: "text-purple-600" },
  zip: { icon: "Archive", color: "text-yellow-600" },
  figma: { icon: "Palette", color: "text-pink-600" },
  sql: { icon: "Database", color: "text-indigo-600" }
};