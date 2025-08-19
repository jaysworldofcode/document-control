// Types for Project Management with SharePoint Integration and Dynamic Fields

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type CustomFieldType = 'text' | 'number' | 'checkbox' | 'date' | 'select';

// SharePoint Integration Types
export interface SharePointConfig {
  folderPath: string;
  folderId?: string;
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
  manager: string;
  managerId?: string;
  team: string[];
  teamIds?: string[];
  startDate: string;
  endDate: string;
  progress: number;
  documentsCount: number;
  budget: string;
  client: string;
  clientId?: string;
  
  // SharePoint Integration
  sharePointConfig: SharePointConfig;
  
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

// Form Data Types
export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  manager: string;
  managerId?: string;
  team: string[];
  startDate: string;
  endDate: string;
  budget: string;
  client: string;
  clientId?: string;
  
  // SharePoint Configuration
  sharePointFolderPath: string;
  sharePointFolderId?: string;
  sharePointExcelPath?: string;
  sharePointExcelId?: string;
  enableExcelLogging: boolean;
  
  // Custom Fields
  customFields: CustomField[];
  
  tags?: string[];
  category?: string;
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
  managerId: string;
  teamIds: string[];
  startDate: string;
  endDate: string;
  budget: string;
  clientId?: string;
  sharePointConfig: SharePointConfig;
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
  { value: 'number', label: 'Number Field', description: 'Numeric input with validation' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false checkbox field' },
  { value: 'date', label: 'Date Picker', description: 'Date selection field' },
  { value: 'select', label: 'Dropdown Select', description: 'Predefined options dropdown' }
];
