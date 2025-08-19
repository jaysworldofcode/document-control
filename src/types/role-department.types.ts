// Types for Role and Department Management

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: 'admin' | 'manager' | 'user';
  departmentId?: string;
  isActive: boolean;
  assignedUsers: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headOfDepartment?: string;
  parentDepartmentId?: string;
  isActive: boolean;
  userCount: number;
  roleCount: number;
  location?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
  level: 'admin' | 'manager' | 'user';
  departmentId?: string;
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {
  id: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  headOfDepartment?: string;
  parentDepartmentId?: string;
  location?: string;
  budget?: number;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  id: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  level: 'admin' | 'manager' | 'user';
  departmentId: string;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  headOfDepartment: string;
  parentDepartmentId: string;
  location: string;
  budget: string;
}

export type TabType = 'roles' | 'departments';

export interface RoleDepartmentFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  department?: string;
}

export interface SortConfig {
  key: keyof Role | keyof Department;
  direction: 'asc' | 'desc';
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isLoading: boolean;
  isValid: boolean;
}

// Action types for reducers
export type RoleAction = 
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'ADD_ROLE'; payload: Role }
  | { type: 'UPDATE_ROLE'; payload: Role }
  | { type: 'DELETE_ROLE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export type DepartmentAction = 
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'ADD_DEPARTMENT'; payload: Department }
  | { type: 'UPDATE_DEPARTMENT'; payload: Department }
  | { type: 'DELETE_DEPARTMENT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// State types
export interface RoleState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

export interface DepartmentState {
  departments: Department[];
  loading: boolean;
  error: string | null;
}
