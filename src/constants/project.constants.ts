import { Project, CustomField, SharePointConfig } from '@/types/project.types';

// Sample Custom Fields for different project types
export const ENGINEERING_CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'field_1',
    name: 'beDocumentNumber',
    label: 'BE Document Number',
    type: 'text',
    required: true,
    placeholder: 'e.g., BE-DOC-2024-001',
    helpText: 'Internal Business Engineering document reference number',
    validation: {
      pattern: '^BE-DOC-\\d{4}-\\d{3}$',
      minLength: 10,
      maxLength: 15
    },
    order: 1,
    isActive: true
  },
  {
    id: 'field_2',
    name: 'documentTitle',
    label: 'Document Title',
    type: 'text',
    required: true,
    placeholder: 'Enter descriptive document title',
    helpText: 'Clear, descriptive title for the document',
    validation: {
      minLength: 5,
      maxLength: 100
    },
    order: 2,
    isActive: true
  },
  {
    id: 'field_3',
    name: 'clientDocNumber',
    label: "Client's Document Number",
    type: 'text',
    required: false,
    placeholder: 'Client reference number',
    helpText: 'Document reference number provided by the client',
    validation: {
      maxLength: 50
    },
    order: 3,
    isActive: true
  },
  {
    id: 'field_4',
    name: 'vendorDocNumber',
    label: 'Vendor Document Number',
    type: 'text',
    required: false,
    placeholder: 'Vendor reference number',
    helpText: 'Document reference number from vendor/supplier',
    validation: {
      maxLength: 50
    },
    order: 4,
    isActive: true
  },
  {
    id: 'field_5',
    name: 'beRevision',
    label: 'BE Revision',
    type: 'number',
    required: true,
    placeholder: '0',
    helpText: 'Business Engineering revision number',
    defaultValue: 0,
    validation: {
      min: 0,
      max: 999
    },
    order: 5,
    isActive: true
  },
  {
    id: 'field_6',
    name: 'documentType',
    label: 'Document Type',
    type: 'select',
    required: true,
    helpText: 'Category of the engineering document',
    options: ['Technical Specification', 'Design Drawing', 'Calculation Sheet', 'Test Report', 'Procedure', 'Manual', 'Other'],
    defaultValue: 'Technical Specification',
    order: 6,
    isActive: true
  },
  {
    id: 'field_7',
    name: 'isConfidential',
    label: 'Confidential Document',
    type: 'checkbox',
    required: false,
    helpText: 'Mark if this document contains confidential information',
    defaultValue: false,
    order: 7,
    isActive: true
  },
  {
    id: 'field_8',
    name: 'reviewDate',
    label: 'Next Review Date',
    type: 'date',
    required: false,
    helpText: 'Date when this document should be reviewed next',
    order: 8,
    isActive: true
  }
];

export const LEGAL_CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'field_legal_1',
    name: 'contractNumber',
    label: 'Contract Number',
    type: 'text',
    required: true,
    placeholder: 'e.g., CONT-2024-001',
    helpText: 'Unique contract reference number',
    validation: {
      pattern: '^CONT-\\d{4}-\\d{3}$',
      minLength: 8,
      maxLength: 20
    },
    order: 1,
    isActive: true
  },
  {
    id: 'field_legal_2',
    name: 'partyName',
    label: 'Contracting Party',
    type: 'text',
    required: true,
    placeholder: 'Name of the contracting party',
    validation: {
      minLength: 2,
      maxLength: 100
    },
    order: 2,
    isActive: true
  },
  {
    id: 'field_legal_3',
    name: 'contractValue',
    label: 'Contract Value',
    type: 'number',
    required: false,
    placeholder: '0',
    helpText: 'Total value of the contract in USD',
    validation: {
      min: 0
    },
    order: 3,
    isActive: true
  },
  {
    id: 'field_legal_4',
    name: 'effectiveDate',
    label: 'Effective Date',
    type: 'date',
    required: true,
    helpText: 'Date when the contract becomes effective',
    order: 4,
    isActive: true
  },
  {
    id: 'field_legal_5',
    name: 'expirationDate',
    label: 'Expiration Date',
    type: 'date',
    required: false,
    helpText: 'Date when the contract expires',
    order: 5,
    isActive: true
  },
  {
    id: 'field_legal_6',
    name: 'requiresApproval',
    label: 'Requires Legal Approval',
    type: 'checkbox',
    required: false,
    helpText: 'Indicates if this document requires legal department approval',
    defaultValue: true,
    order: 6,
    isActive: true
  }
];

export const FINANCE_CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'field_fin_1',
    name: 'invoiceNumber',
    label: 'Invoice Number',
    type: 'text',
    required: true,
    placeholder: 'e.g., INV-2024-001',
    validation: {
      minLength: 5,
      maxLength: 30
    },
    order: 1,
    isActive: true
  },
  {
    id: 'field_fin_2',
    name: 'amount',
    label: 'Amount',
    type: 'number',
    required: true,
    placeholder: '0.00',
    helpText: 'Total amount in USD',
    validation: {
      min: 0
    },
    order: 2,
    isActive: true
  },
  {
    id: 'field_fin_3',
    name: 'currency',
    label: 'Currency',
    type: 'select',
    required: true,
    options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    defaultValue: 'USD',
    order: 3,
    isActive: true
  },
  {
    id: 'field_fin_4',
    name: 'dueDate',
    label: 'Due Date',
    type: 'date',
    required: false,
    helpText: 'Payment due date',
    order: 4,
    isActive: true
  },
  {
    id: 'field_fin_5',
    name: 'isPaid',
    label: 'Payment Received',
    type: 'checkbox',
    required: false,
    defaultValue: false,
    order: 5,
    isActive: true
  }
];

// Sample SharePoint Configurations
export const SHAREPOINT_CONFIGS: { [key: string]: SharePointConfig } = {
  engineering: {
    folderPath: '/sites/CompanyDocs/Engineering/Projects/',
    folderId: 'SP_ENG_001',
    excelSheetPath: '/sites/CompanyDocs/Engineering/Logs/DocumentLog.xlsx',
    excelSheetId: 'SP_EXCEL_ENG_001',
    isExcelLoggingEnabled: true
  },
  legal: {
    folderPath: '/sites/CompanyDocs/Legal/Contracts/',
    folderId: 'SP_LEGAL_001',
    excelSheetPath: '/sites/CompanyDocs/Legal/Logs/ContractLog.xlsx',
    excelSheetId: 'SP_EXCEL_LEGAL_001',
    isExcelLoggingEnabled: true
  },
  finance: {
    folderPath: '/sites/CompanyDocs/Finance/Invoices/',
    folderId: 'SP_FIN_001',
    excelSheetPath: '/sites/CompanyDocs/Finance/Logs/InvoiceLog.xlsx',
    excelSheetId: 'SP_EXCEL_FIN_001',
    isExcelLoggingEnabled: true
  },
  hr: {
    folderPath: '/sites/CompanyDocs/HR/Personnel/',
    folderId: 'SP_HR_001',
    isExcelLoggingEnabled: false
  },
  marketing: {
    folderPath: '/sites/CompanyDocs/Marketing/Campaigns/',
    folderId: 'SP_MKT_001',
    excelSheetPath: '/sites/CompanyDocs/Marketing/Logs/CampaignTracker.xlsx',
    excelSheetId: 'SP_EXCEL_MKT_001',
    isExcelLoggingEnabled: true
  }
};

// Mock Projects with SharePoint Integration and Custom Fields
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'Document Management System v2.0',
    description: 'Comprehensive upgrade of the current document management platform with enhanced security and user experience.',
    status: 'active',
    priority: 'high',
    managers: [
      {
        id: 'user_001',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@techcorp.com',
        role: 'Project Manager',
        canApproveDocuments: true,
        isPrimaryManager: true,
        addedAt: '2024-01-10T09:00:00Z',
        addedBy: 'admin@company.com'
      },
      {
        id: 'user_021',
        name: 'Robert Chen',
        email: 'robert.chen@techcorp.com',
        role: 'Technical Lead',
        canApproveDocuments: true,
        isPrimaryManager: false,
        addedAt: '2024-01-15T14:00:00Z',
        addedBy: 'sarah.wilson@techcorp.com'
      }
    ],
    team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    teamIds: ['user_002', 'user_003', 'user_004'],
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    progress: 75,
    documentsCount: 142,
    budget: '$125,000',
    client: 'TechCorp Industries',
    clientId: 'client_001',
    sharePointConfig: SHAREPOINT_CONFIGS.engineering,
    customFields: ENGINEERING_CUSTOM_FIELDS,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-08-15T14:30:00Z',
    createdBy: 'admin@company.com',
    tags: ['software', 'upgrade', 'security'],
    category: 'Engineering',
    isArchived: false
  },
  {
    id: 'proj_2',
    name: 'Legal Contract Management Portal',
    description: 'Development of a specialized portal for managing legal contracts, agreements, and compliance documentation.',
    status: 'planning',
    priority: 'medium',
    managers: [
      {
        id: 'user_005',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@company.com',
        role: 'Legal Manager',
        canApproveDocuments: true,
        isPrimaryManager: true,
        addedAt: '2024-02-20T10:00:00Z',
        addedBy: 'admin@company.com'
      }
    ],
    team: ['Alice Brown', 'Bob Wilson', 'Carol Davis'],
    teamIds: ['user_006', 'user_007', 'user_008'],
    startDate: '2024-03-01',
    endDate: '2024-08-15',
    progress: 25,
    documentsCount: 23,
    budget: '$85,000',
    client: 'LegalPartners LLC',
    clientId: 'client_002',
    sharePointConfig: SHAREPOINT_CONFIGS.legal,
    customFields: LEGAL_CUSTOM_FIELDS,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-08-10T16:20:00Z',
    createdBy: 'emily.rodriguez@company.com',
    tags: ['legal', 'contracts', 'compliance'],
    category: 'Legal',
    isArchived: false
  },
  {
    id: 'proj_3',
    name: 'Financial Invoice Processing System',
    description: 'Automated invoice processing and approval workflow system with integration to accounting software.',
    status: 'active',
    priority: 'high',
    managers: [
      {
        id: 'user_009',
        name: 'David Chen',
        email: 'david.chen@company.com',
        role: 'Finance Manager',
        canApproveDocuments: true,
        isPrimaryManager: true,
        addedAt: '2024-01-25T08:30:00Z',
        addedBy: 'admin@company.com'
      },
      {
        id: 'user_022',
        name: 'Lisa Martinez',
        email: 'lisa.martinez@company.com',
        role: 'Senior Finance Analyst',
        canApproveDocuments: true,
        isPrimaryManager: false,
        addedAt: '2024-02-10T11:00:00Z',
        addedBy: 'david.chen@company.com'
      }
    ],
    team: ['Tom Anderson', 'Lisa Garcia', 'Mark Thompson'],
    teamIds: ['user_010', 'user_011', 'user_012'],
    startDate: '2024-02-01',
    endDate: '2024-07-30',
    progress: 60,
    documentsCount: 89,
    budget: '$95,000',
    client: 'FinanceSecure Corp',
    clientId: 'client_003',
    sharePointConfig: SHAREPOINT_CONFIGS.finance,
    customFields: FINANCE_CUSTOM_FIELDS,
    createdAt: '2024-01-25T08:30:00Z',
    updatedAt: '2024-08-12T11:45:00Z',
    createdBy: 'david.chen@company.com',
    tags: ['finance', 'automation', 'invoices'],
    category: 'Finance',
    isArchived: false
  },
  {
    id: 'proj_4',
    name: 'HR Document Digitization',
    description: 'Digitization of paper-based HR documents and implementation of digital workflow processes.',
    status: 'completed',
    priority: 'medium',
    managers: [
      {
        id: 'user_013',
        name: 'Anna Davis',
        email: 'anna.davis@company.com',
        role: 'HR Manager',
        canApproveDocuments: true,
        isPrimaryManager: true,
        addedAt: '2023-09-15T09:00:00Z',
        addedBy: 'admin@company.com'
      }
    ],
    team: ['Ryan Lee', 'Sophie Chen'],
    teamIds: ['user_014', 'user_015'],
    startDate: '2023-10-01',
    endDate: '2024-01-31',
    progress: 100,
    documentsCount: 156,
    budget: '$65,000',
    client: 'Internal HR Department',
    sharePointConfig: SHAREPOINT_CONFIGS.hr,
    customFields: [
      {
        id: 'field_hr_1',
        name: 'employeeId',
        label: 'Employee ID',
        type: 'text',
        required: true,
        placeholder: 'e.g., EMP-001',
        validation: { pattern: '^EMP-\\d{3}$' },
        order: 1,
        isActive: true
      },
      {
        id: 'field_hr_2',
        name: 'department',
        label: 'Department',
        type: 'select',
        required: true,
        options: ['Engineering', 'HR', 'Finance', 'Legal', 'Marketing', 'Operations'],
        order: 2,
        isActive: true
      },
      {
        id: 'field_hr_3',
        name: 'confidential',
        label: 'Confidential',
        type: 'checkbox',
        required: false,
        defaultValue: true,
        order: 3,
        isActive: true
      }
    ],
    createdAt: '2023-09-15T09:00:00Z',
    updatedAt: '2024-02-05T15:20:00Z',
    createdBy: 'anna.davis@company.com',
    tags: ['hr', 'digitization', 'workflow'],
    category: 'Human Resources',
    isArchived: false
  },
  {
    id: 'proj_5',
    name: 'Marketing Campaign Asset Manager',
    description: 'Central repository for marketing materials, campaign assets, and brand guidelines with approval workflows.',
    status: 'on-hold',
    priority: 'low',
    managers: [
      {
        id: 'user_016',
        name: 'Chris Taylor',
        email: 'chris.taylor@company.com',
        role: 'Marketing Manager',
        canApproveDocuments: true,
        isPrimaryManager: true,
        addedAt: '2024-03-20T14:00:00Z',
        addedBy: 'admin@company.com'
      },
      {
        id: 'user_023',
        name: 'Jennifer Park',
        email: 'jennifer.park@company.com',
        role: 'Creative Director',
        canApproveDocuments: true,
        isPrimaryManager: false,
        addedAt: '2024-04-05T10:30:00Z',
        addedBy: 'chris.taylor@company.com'
      }
    ],
    team: ['Sam Wilson', 'Amy Johnson'],
    teamIds: ['user_017', 'user_018'],
    startDate: '2024-04-01',
    endDate: '2024-09-30',
    progress: 15,
    documentsCount: 34,
    budget: '$55,000',
    client: 'Marketing Department',
    sharePointConfig: SHAREPOINT_CONFIGS.marketing,
    customFields: [
      {
        id: 'field_mkt_1',
        name: 'campaignName',
        label: 'Campaign Name',
        type: 'text',
        required: true,
        placeholder: 'Campaign title',
        order: 1,
        isActive: true
      },
      {
        id: 'field_mkt_2',
        name: 'assetType',
        label: 'Asset Type',
        type: 'select',
        required: true,
        options: ['Image', 'Video', 'Audio', 'Document', 'Presentation', 'Other'],
        order: 2,
        isActive: true
      },
      {
        id: 'field_mkt_3',
        name: 'approvedForUse',
        label: 'Approved for Use',
        type: 'checkbox',
        required: false,
        defaultValue: false,
        order: 3,
        isActive: true
      },
      {
        id: 'field_mkt_4',
        name: 'launchDate',
        label: 'Campaign Launch Date',
        type: 'date',
        required: false,
        order: 4,
        isActive: true
      }
    ],
    createdAt: '2024-03-20T14:00:00Z',
    updatedAt: '2024-06-10T10:30:00Z',
    createdBy: 'chris.taylor@company.com',
    tags: ['marketing', 'assets', 'campaigns'],
    category: 'Marketing',
    isArchived: false
  }
];

// SharePoint Folder Templates
export const SHAREPOINT_FOLDER_TEMPLATES = [
  {
    category: 'Engineering',
    path: '/sites/CompanyDocs/Engineering/Projects/',
    description: 'Technical documents, specifications, and engineering files'
  },
  {
    category: 'Legal',
    path: '/sites/CompanyDocs/Legal/Contracts/',
    description: 'Legal documents, contracts, and compliance files'
  },
  {
    category: 'Finance',
    path: '/sites/CompanyDocs/Finance/Invoices/',
    description: 'Financial documents, invoices, and accounting files'
  },
  {
    category: 'HR',
    path: '/sites/CompanyDocs/HR/Personnel/',
    description: 'Human resources documents and personnel files'
  },
  {
    category: 'Marketing',
    path: '/sites/CompanyDocs/Marketing/Campaigns/',
    description: 'Marketing materials, campaigns, and brand assets'
  },
  {
    category: 'Operations',
    path: '/sites/CompanyDocs/Operations/Procedures/',
    description: 'Operational procedures and process documentation'
  }
];

// Excel Sheet Templates
export const EXCEL_SHEET_TEMPLATES = [
  {
    category: 'Engineering',
    path: '/sites/CompanyDocs/Engineering/Logs/DocumentLog.xlsx',
    description: 'Tracks all engineering document uploads and metadata'
  },
  {
    category: 'Legal',
    path: '/sites/CompanyDocs/Legal/Logs/ContractLog.xlsx',
    description: 'Maintains log of all legal contracts and agreements'
  },
  {
    category: 'Finance',
    path: '/sites/CompanyDocs/Finance/Logs/InvoiceLog.xlsx',
    description: 'Records all invoice submissions and processing status'
  },
  {
    category: 'Marketing',
    path: '/sites/CompanyDocs/Marketing/Logs/CampaignTracker.xlsx',
    description: 'Tracks marketing assets and campaign performance'
  }
];
