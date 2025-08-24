import { Document, DocumentRevision } from "@/types/document.types";

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc-001",
    name: "System Architecture Document",
    fileName: "system_architecture_v2.1.pdf",
    fileType: "pdf",
    fileSize: 2450000, // 2.45 MB
    version: "2.1",
    status: "approved",
    uploadedBy: "John Doe",
    uploadedAt: "2024-08-15T10:30:00Z",
    lastModified: "2024-08-15T10:30:00Z",
    lastModifiedBy: "John Doe",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Architecture/system_architecture_v2.1.pdf",
    description: "Complete system architecture documentation for DMS v2.0 including data flow, security protocols, and integration points.",
    tags: ["architecture", "technical", "system-design"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Technical Specification",
      "security-level": "Confidential",
      "review-cycle": "Quarterly"
    },
    approvalWorkflow: {
      id: "workflow_001",
      currentStep: 2,
      totalSteps: 2,
      overallStatus: 'approved',
      steps: [
        {
          id: "step_001_1",
          approverId: "user_123",
          approverName: "Sarah Wilson",
          approverEmail: "sarah.wilson@techcorp.com",
          department: "Engineering",
          order: 1,
          status: 'approved',
          approvedAt: "2024-08-14T14:20:00Z",
          comments: "Architecture looks solid. Approved for implementation.",
          viewedDocument: true,
          downloadedDocument: true,
          openedInSharePoint: false
        },
        {
          id: "step_001_2",
          approverId: "user_234",
          approverName: "David Chen",
          approverEmail: "david.chen@techcorp.com",
          department: "Security",
          order: 2,
          status: 'approved',
          approvedAt: "2024-08-15T09:15:00Z",
          comments: "Security protocols are comprehensive. Good to go.",
          viewedDocument: true,
          downloadedDocument: false,
          openedInSharePoint: true
        }
      ],
      requestedBy: "John Doe",
      requestedAt: "2024-08-13T10:00:00Z",
      completedAt: "2024-08-15T09:15:00Z"
    },
    revisionHistory: [
      {
        id: "rev-001",
        version: "1.0",
        uploadedBy: "John Doe",
        uploadedAt: "2024-08-01T08:00:00Z",
        changes: "Initial version",
        filePath: "/TechCorp/Projects/DMS-v2/Architecture/system_architecture_v1.0.pdf"
      },
      {
        id: "rev-002",
        version: "2.0",
        uploadedBy: "John Doe",
        uploadedAt: "2024-08-10T11:30:00Z",
        changes: "Updated security protocols and added integration diagrams",
        filePath: "/TechCorp/Projects/DMS-v2/Architecture/system_architecture_v2.0.pdf"
      },
      {
        id: "rev-003",
        version: "2.1",
        uploadedBy: "John Doe",
        uploadedAt: "2024-08-15T10:30:00Z",
        changes: "Minor corrections to data flow diagrams",
        filePath: "/TechCorp/Projects/DMS-v2/Architecture/system_architecture_v2.1.pdf"
      }
    ]
  },
  {
    id: "doc-002",
    name: "User Interface Mockups",
    fileName: "ui_mockups_dashboard.figma",
    fileType: "figma",
    fileSize: 15600000, // 15.6 MB
    version: "3.2",
    status: "under_review",
    uploadedBy: "Jane Smith",
    uploadedAt: "2024-08-18T16:45:00Z",
    lastModified: "2024-08-18T16:45:00Z",
    lastModifiedBy: "Jane Smith",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_dashboard.figma",
    description: "Complete UI/UX mockups for the new dashboard interface including responsive design variations.",
    tags: ["design", "ui", "ux", "dashboard"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Design Specification",
      "design-tool": "Figma",
      "responsive": "Yes"
    },
    approvalWorkflow: {
      id: "workflow_002",
      currentStep: 1,
      totalSteps: 2,
      overallStatus: 'pending',
      steps: [
        {
          id: "step_002_1",
          approverId: "user_345",
          approverName: "Mike Johnson",
          approverEmail: "mike.johnson@techcorp.com",
          department: "UX Design",
          order: 1,
          status: 'pending',
          viewedDocument: false,
          downloadedDocument: false,
          openedInSharePoint: false
        },
        {
          id: "step_002_2",
          approverId: "user_456",
          approverName: "Emily Rodriguez",
          approverEmail: "emily.rodriguez@techcorp.com",
          department: "Product Management",
          order: 2,
          status: 'pending',
          viewedDocument: false,
          downloadedDocument: false,
          openedInSharePoint: false
        }
      ],
      requestedBy: "Jane Smith",
      requestedAt: "2024-08-18T17:00:00Z"
    },
    revisionHistory: [
      {
        id: "rev-004",
        version: "1.0",
        uploadedBy: "Jane Smith",
        uploadedAt: "2024-08-05T09:00:00Z",
        changes: "Initial mockup designs",
        filePath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_v1.0.figma"
      },
      {
        id: "rev-005",
        version: "2.0",
        uploadedBy: "Jane Smith",
        uploadedAt: "2024-08-12T14:20:00Z",
        changes: "Added responsive breakpoints and mobile variations",
        filePath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_v2.0.figma"
      },
      {
        id: "rev-006",
        version: "3.0",
        uploadedBy: "Jane Smith",
        uploadedAt: "2024-08-16T10:15:00Z",
        changes: "Integrated feedback from stakeholder review",
        filePath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_v3.0.figma"
      },
      {
        id: "rev-007",
        version: "3.2",
        uploadedBy: "Jane Smith",
        uploadedAt: "2024-08-18T16:45:00Z",
        changes: "Minor color adjustments and typography improvements",
        filePath: "/TechCorp/Projects/DMS-v2/Design/ui_mockups_dashboard.figma"
      }
    ]
  },
  {
    id: "doc-003",
    name: "Database Schema",
    fileName: "database_schema.sql",
    fileType: "sql",
    fileSize: 125000, // 125 KB
    version: "1.5",
    status: "rejected",
    uploadedBy: "Tom Anderson",
    uploadedAt: "2024-08-17T11:20:00Z",
    lastModified: "2024-08-17T11:20:00Z",
    lastModifiedBy: "Tom Anderson",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Database/database_schema.sql",
    description: "Complete database schema with tables, relationships, indexes, and stored procedures.",
    tags: ["database", "schema", "sql"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Technical Specification",
      "database-type": "PostgreSQL",
      "environment": "Development"
    },
    approvalWorkflow: {
      id: "workflow_003",
      currentStep: 2,
      totalSteps: 3,
      overallStatus: 'rejected',
      steps: [
        {
          id: "step_003_1",
          approverId: "user_456",
          approverName: "Sarah Wilson",
          approverEmail: "sarah.wilson@techcorp.com",
          department: "Database Administration",
          order: 1,
          status: 'approved',
          approvedAt: "2024-08-17T14:30:00Z",
          comments: "Schema structure looks good. Indexing strategy is well thought out.",
          viewedDocument: true,
          downloadedDocument: true,
          openedInSharePoint: false
        },
        {
          id: "step_003_2",
          approverId: "user_789",
          approverName: "Michael Roberts",
          approverEmail: "michael.roberts@techcorp.com",
          department: "Security Team",
          order: 2,
          status: 'rejected',
          rejectedAt: "2024-08-18T09:15:00Z",
          comments: "Security concerns identified: Missing encryption for sensitive data fields, no audit trail for data modifications, and insufficient access controls. Please address these issues and implement field-level encryption for PII data.",
          viewedDocument: true,
          downloadedDocument: true,
          openedInSharePoint: true
        },
        {
          id: "step_003_3",
          approverId: "user_101",
          approverName: "Lisa Chen",
          approverEmail: "lisa.chen@techcorp.com",
          department: "IT Architecture",
          order: 3,
          status: 'pending',
          viewedDocument: false,
          downloadedDocument: false,
          openedInSharePoint: false
        }
      ],
      requestedBy: "Tom Anderson",
      requestedAt: "2024-08-17T12:00:00Z"
    },
    revisionHistory: [
      {
        id: "rev-008",
        version: "1.0",
        uploadedBy: "Tom Anderson",
        uploadedAt: "2024-08-08T13:30:00Z",
        changes: "Initial schema design",
        filePath: "/TechCorp/Projects/DMS-v2/Database/database_schema_v1.0.sql"
      },
      {
        id: "rev-009",
        version: "1.5",
        uploadedBy: "Tom Anderson",
        uploadedAt: "2024-08-17T11:20:00Z",
        changes: "Added audit tables and performance indexes",
        filePath: "/TechCorp/Projects/DMS-v2/Database/database_schema.sql"
      }
    ]
  },
  {
    id: "doc-004",
    name: "API Documentation",
    fileName: "api_documentation.md",
    fileType: "markdown",
    fileSize: 890000, // 890 KB
    version: "1.8",
    status: "draft",
    uploadedBy: "Alice Brown",
    uploadedAt: "2024-08-19T08:30:00Z",
    lastModified: "2024-08-19T08:30:00Z",
    lastModifiedBy: "Alice Brown",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Documentation/api_documentation.md",
    description: "Comprehensive API documentation with endpoints, request/response examples, and authentication details.",
    tags: ["api", "documentation", "endpoints"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Technical Documentation",
      "api-version": "v2.0",
      "format": "Markdown"
    },
    revisionHistory: [
      {
        id: "rev-010",
        version: "1.0",
        uploadedBy: "Alice Brown",
        uploadedAt: "2024-08-03T10:00:00Z",
        changes: "Initial API documentation",
        filePath: "/TechCorp/Projects/DMS-v2/Documentation/api_documentation_v1.0.md"
      },
      {
        id: "rev-011",
        version: "1.5",
        uploadedBy: "Alice Brown",
        uploadedAt: "2024-08-14T15:45:00Z",
        changes: "Added authentication examples and error codes",
        filePath: "/TechCorp/Projects/DMS-v2/Documentation/api_documentation_v1.5.md"
      },
      {
        id: "rev-012",
        version: "1.8",
        uploadedBy: "Alice Brown",
        uploadedAt: "2024-08-19T08:30:00Z",
        changes: "Updated endpoint descriptions and added new endpoints",
        filePath: "/TechCorp/Projects/DMS-v2/Documentation/api_documentation.md"
      }
    ]
  },
  {
    id: "doc-005",
    name: "Security Assessment Report",
    fileName: "security_assessment_2024.pdf",
    fileType: "pdf",
    fileSize: 3200000, // 3.2 MB
    version: "1.0",
    status: "final",
    uploadedBy: "Lisa Garcia",
    uploadedAt: "2024-08-10T14:15:00Z",
    lastModified: "2024-08-10T14:15:00Z",
    lastModifiedBy: "Lisa Garcia",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Security/security_assessment_2024.pdf",
    description: "Comprehensive security assessment including vulnerability analysis, penetration testing results, and remediation recommendations.",
    tags: ["security", "assessment", "vulnerability", "compliance"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Security Report",
      "security-level": "Restricted",
      "compliance-standard": "ISO 27001"
    },
    approvalWorkflow: {
      id: "workflow_005",
      currentStep: 1,
      totalSteps: 1,
      overallStatus: 'approved',
      steps: [
        {
          id: "step_005_1",
          approverId: "user_789",
          approverName: "Alex Kumar",
          approverEmail: "alex.kumar@techcorp.com",
          department: "Security",
          order: 1,
          status: 'approved',
          approvedAt: "2024-08-10T16:30:00Z",
          comments: "Thorough assessment. All critical issues have been addressed.",
          viewedDocument: true,
          downloadedDocument: true,
          openedInSharePoint: true
        }
      ],
      requestedBy: "Lisa Garcia",
      requestedAt: "2024-08-10T15:00:00Z",
      completedAt: "2024-08-10T16:30:00Z"
    },
    revisionHistory: [
      {
        id: "rev-013",
        version: "1.0",
        uploadedBy: "Lisa Garcia",
        uploadedAt: "2024-08-10T14:15:00Z",
        changes: "Final security assessment report",
        filePath: "/TechCorp/Projects/DMS-v2/Security/security_assessment_2024.pdf"
      }
    ]
  },
  {
    id: "doc-006",
    name: "Test Plan Document",
    fileName: "test_plan_v1.3.docx",
    fileType: "docx",
    fileSize: 1800000, // 1.8 MB
    version: "1.3",
    status: "pending_review",
    uploadedBy: "Bob Wilson",
    uploadedAt: "2024-08-18T12:00:00Z",
    lastModified: "2024-08-18T12:00:00Z",
    lastModifiedBy: "Bob Wilson",
    sharePointPath: "/TechCorp/Projects/DMS-v2/Testing/test_plan_v1.3.docx",
    description: "Comprehensive test plan covering functional, integration, performance, and security testing scenarios.",
    tags: ["testing", "qa", "test-plan"],
    projectId: "proj_1",
    customFieldValues: {
      "document-type": "Test Documentation",
      "test-level": "System Testing",
      "automation": "Partial"
    },
    approvalWorkflow: {
      id: "workflow_006",
      currentStep: 1,
      totalSteps: 1,
      overallStatus: 'pending',
      steps: [
        {
          id: "step_006_1",
          approverId: "user_910",
          approverName: "Mark Thompson",
          approverEmail: "mark.thompson@techcorp.com",
          department: "QA Team",
          order: 1,
          status: 'pending',
          viewedDocument: false,
          downloadedDocument: false,
          openedInSharePoint: false
        }
      ],
      requestedBy: "Bob Wilson",
      requestedAt: "2024-08-18T13:00:00Z"
    },
    revisionHistory: [
      {
        id: "rev-014",
        version: "1.0",
        uploadedBy: "Bob Wilson",
        uploadedAt: "2024-08-02T09:45:00Z",
        changes: "Initial test plan",
        filePath: "/TechCorp/Projects/DMS-v2/Testing/test_plan_v1.0.docx"
      },
      {
        id: "rev-015",
        version: "1.3",
        uploadedBy: "Bob Wilson",
        uploadedAt: "2024-08-18T12:00:00Z",
        changes: "Added performance testing scenarios and automation framework details",
        filePath: "/TechCorp/Projects/DMS-v2/Testing/test_plan_v1.3.docx"
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
    description: "Review completed and approved" 
  },
  rejected: { 
    label: "Rejected", 
    variant: "destructive" as const, 
    description: "Review completed but rejected" 
  },
  archived: { 
    label: "Archived", 
    variant: "outline" as const, 
    description: "Document has been archived" 
  },
  checked_out: { 
    label: "Checked Out", 
    variant: "warning" as const, 
    description: "Document is checked out for editing" 
  },
  final: { 
    label: "Final", 
    variant: "default" as const, 
    description: "Final approved version" 
  }
};

export const FILE_TYPE_CONFIG = {
  pdf: { icon: "📄", color: "text-red-600" },
  docx: { icon: "📝", color: "text-blue-600" },
  xlsx: { icon: "📊", color: "text-green-600" },
  pptx: { icon: "📺", color: "text-orange-600" },
  txt: { icon: "📋", color: "text-gray-600" },
  md: { icon: "📝", color: "text-purple-600" },
  markdown: { icon: "📝", color: "text-purple-600" },
  sql: { icon: "🗄️", color: "text-yellow-600" },
  figma: { icon: "🎨", color: "text-pink-600" },
  sketch: { icon: "🎨", color: "text-orange-600" },
  zip: { icon: "📦", color: "text-gray-600" },
  default: { icon: "📄", color: "text-gray-600" }
};
