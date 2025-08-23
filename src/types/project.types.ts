// Types for Project Management with SharePoint Integration and Dynamic Fields

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type CustomFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'boolean' | 'date' | 'select' | 'file';

// SharePoint Integration Types
export interface SharePointConfig {
  siteUrl: string; // Project-specific SharePoint site URL
  documentLibrary: string; // Project-specific document library name
  excelSheetPath?: string; // Optional Excel sheet for logging
  excelSheetId?: string;
  isExcelLoggingEnabled: boolean;
}

// Dynamic Custom Fields
export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: string[]; // For select type fields
  defaultValue?: string | number | boolean;
  order: number; // For field ordering
  isActive: boolean;
}

// Project Interface
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  managers: ProjectManager[]; // Changed from single manager to multiple managers
  team: TeamMember[]; // Add team property
  startDate: string;
  endDate: string;
  progress: number;
  documentsCount: number;
  budget: string;
  client: string;
  clientId?: string;
  
  // SharePoint Integration - Support multiple configurations
  sharePointConfig: SharePointConfig; // Keep for backward compatibility
  sharePointConfigs: SharePointConfigFormData[]; // New: Multiple configurations
  
  // Dynamic Custom Fields Configuration
  customFields: CustomField[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags?: string[];
  category?: string;
  isArchived: boolean;
}

// Project Manager Interface
export interface ProjectManager {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  canApproveDocuments: boolean;
  isPrimaryManager: boolean; // One manager should be primary
  addedAt: string;
  addedBy: string;
}

// Form Data Types
export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  managers: ProjectManager[]; // Changed to support multiple managers
  team: TeamMember[]; // Add team property
  startDate: string;
  endDate: string;
  budget: string;
  client: string;
  clientId?: string;
  
  // Multiple SharePoint Configurations
  sharePointConfigs: SharePointConfigFormData[];
  
  // Custom Fields
  customFields: CustomField[];
  
  tags?: string[];
  category?: string;
}

// SharePoint Configuration Form Data
export interface SharePointConfigFormData {
  id: string;
  name: string;
  siteUrl: string;
  documentLibrary: string;
  folderPath?: string;
  excelPath?: string;
  enableExcelLogging: boolean;
  // Additional properties for display and functionality
  isDefault?: boolean;
  isExcelLoggingEnabled?: boolean;
  excelSheetPath?: string;
}

// Custom Field Form Data
export interface CustomFieldFormData {
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string;
  defaultValue?: string;
  validation?: {
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
  };
}

// Document Upload Form Data (with dynamic fields)
export interface DocumentUploadFormData {
  file: File;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  
  // Dynamic custom field values
  customFieldValues: Record<string, string | number | boolean>;
}

// API Request/Response Types
export interface CreateProjectRequest {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  managerIds: string[]; // Changed to support multiple manager IDs
  teamIds: string[];
  startDate: string;
  endDate: string;
  budget: string;
  clientId?: string;
  customFields: CustomField[];
  tags?: string[];
  category?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectDetailsResponse {
  project: Project;
  recentDocuments: Document[];
  teamMembers: TeamMember[];
}

// Supporting Types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  projectId: string;
  sharePointPath?: string;
  customFieldValues: Record<string, any>;
}

// Filter and Search Types
export interface ProjectFilters {
  search: string;
  status: ProjectStatus | 'all';
  priority: ProjectPriority | 'all';
  manager: string | 'all';
  dateRange: {
    start?: string;
    end?: string;
  };
  tags: string[];
  category: string | 'all';
}

export interface SortConfig {
  key: keyof Project;
  direction: 'asc' | 'desc';
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// SharePoint API Types
export interface SharePointFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface SharePointFile {
  id: string;
  name: string;
  path: string;
  size: number;
  contentType: string;
  createdAt: string;
  modifiedAt: string;
  downloadUrl: string;
}

// Excel Logging Types
export interface ExcelLogEntry {
  documentId: string;
  documentTitle: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  projectName: string;
  customFieldValues: Record<string, any>;
}

// Constants
export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: 'blue' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'on-hold', label: 'On Hold', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'purple' },
  { value: 'archived', label: 'Archived', color: 'gray' }
];

export const PROJECT_PRIORITIES: { value: ProjectPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' }
];

export const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text Field', description: 'Single line text input' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text input' },
  { value: 'number', label: 'Number Field', description: 'Numeric input with validation' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false checkbox field' },
  { value: 'boolean', label: 'Boolean Switch', description: 'True/false toggle switch' },
  { value: 'date', label: 'Date Picker', description: 'Date selection field' },
  { value: 'select', label: 'Dropdown Select', description: 'Predefined options dropdown' },
  { value: 'file', label: 'File Upload', description: 'File attachment field' }
];

// Approval Workflow Types
export type ApprovalStatus = 'pending' | 'under-review' | 'approved' | 'rejected';

export interface Approver {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar?: string;
}

export interface ApprovalStep {
  id: string;
  approverId: string;
  approverName: string;
  approverEmail: string;
  department: string;
  order: number;
  status: ApprovalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  viewedDocument?: boolean;
  downloadedDocument?: boolean;
  openedInSharePoint?: boolean;
}

export interface DocumentApproval {
  id: string;
  documentId: string;
  requestedBy: string;
  requestedAt: string;
  currentStep: number;
  totalSteps: number;
  overallStatus: ApprovalStatus;
  steps: ApprovalStep[];
  completedAt?: string;
  comments?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}
