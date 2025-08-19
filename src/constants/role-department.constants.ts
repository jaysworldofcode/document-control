import { Role, Department, Permission } from '@/types/role-department.types';

export const PERMISSIONS: Permission[] = [
  {
    id: 'perm_1',
    name: 'View Documents',
    description: 'Can view and read documents',
    resource: 'documents',
    action: 'read'
  },
  {
    id: 'perm_2',
    name: 'Create Documents',
    description: 'Can create new documents',
    resource: 'documents',
    action: 'create'
  },
  {
    id: 'perm_3',
    name: 'Edit Documents',
    description: 'Can modify existing documents',
    resource: 'documents',
    action: 'update'
  },
  {
    id: 'perm_4',
    name: 'Delete Documents',
    description: 'Can delete documents',
    resource: 'documents',
    action: 'delete'
  },
  {
    id: 'perm_5',
    name: 'Manage Projects',
    description: 'Can create, edit, and manage projects',
    resource: 'projects',
    action: 'manage'
  },
  {
    id: 'perm_6',
    name: 'View Projects',
    description: 'Can view project information',
    resource: 'projects',
    action: 'read'
  },
  {
    id: 'perm_7',
    name: 'Manage Users',
    description: 'Can create, edit, and manage user accounts',
    resource: 'users',
    action: 'manage'
  },
  {
    id: 'perm_8',
    name: 'View Users',
    description: 'Can view user information',
    resource: 'users',
    action: 'read'
  },
  {
    id: 'perm_9',
    name: 'System Administration',
    description: 'Full system administration access',
    resource: 'system',
    action: 'manage'
  },
  {
    id: 'perm_10',
    name: 'Approve Documents',
    description: 'Can approve document workflows',
    resource: 'documents',
    action: 'update'
  },
  {
    id: 'perm_11',
    name: 'Audit Access',
    description: 'Can access audit logs and compliance reports',
    resource: 'audit',
    action: 'read'
  },
  {
    id: 'perm_12',
    name: 'Backup Management',
    description: 'Can manage system backups',
    resource: 'system',
    action: 'manage'
  }
];

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'dept_1',
    name: 'Engineering',
    description: 'Software development and technical operations team responsible for building and maintaining our document management platform.',
    headOfDepartment: 'Sarah Wilson',
    isActive: true,
    userCount: 12,
    roleCount: 4,
    location: 'San Francisco, CA',
    budget: 2500000,
    createdAt: '2023-01-15T09:00:00Z',
    updatedAt: '2024-08-15T14:30:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'dept_2',
    name: 'Legal & Compliance',
    description: 'Legal affairs and regulatory compliance team ensuring all document processes meet industry standards and legal requirements.',
    headOfDepartment: 'Emily Rodriguez',
    isActive: true,
    userCount: 5,
    roleCount: 2,
    location: 'New York, NY',
    budget: 800000,
    createdAt: '2023-02-01T10:00:00Z',
    updatedAt: '2024-07-20T16:45:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'dept_3',
    name: 'Quality Assurance',
    description: 'Quality control and testing team ensuring the highest standards of document integrity and system reliability.',
    headOfDepartment: 'Lisa Garcia',
    isActive: true,
    userCount: 8,
    roleCount: 3,
    location: 'Austin, TX',
    budget: 600000,
    createdAt: '2023-03-10T11:00:00Z',
    updatedAt: '2024-08-10T12:20:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'dept_4',
    name: 'IT Security',
    description: 'Information security team responsible for protecting sensitive documents and maintaining system security protocols.',
    headOfDepartment: 'Alex Kumar',
    isActive: true,
    userCount: 6,
    roleCount: 3,
    location: 'Seattle, WA',
    budget: 1200000,
    createdAt: '2023-04-05T13:00:00Z',
    updatedAt: '2024-08-05T10:15:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'dept_5',
    name: 'Documentation',
    description: 'Technical writing and documentation team creating user guides, API documentation, and system manuals.',
    headOfDepartment: 'David Chen',
    isActive: false,
    userCount: 3,
    roleCount: 2,
    location: 'Remote',
    budget: 300000,
    createdAt: '2023-05-20T14:00:00Z',
    updatedAt: '2024-06-30T15:30:00Z',
    createdBy: 'admin@company.com'
  }
];

export const MOCK_ROLES: Role[] = [
  {
    id: 'role_1',
    name: 'Project Manager',
    description: 'Manages projects, coordinates teams, and oversees document workflows. Has comprehensive access to project management features.',
    permissions: ['perm_1', 'perm_2', 'perm_3', 'perm_5', 'perm_6', 'perm_8', 'perm_10'],
    level: 'manager',
    departmentId: 'dept_1',
    isActive: true,
    assignedUsers: 4,
    createdAt: '2023-01-15T09:30:00Z',
    updatedAt: '2024-08-15T14:45:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'role_2',
    name: 'Senior Developer',
    description: 'Senior software developer with advanced permissions for document management system development and maintenance.',
    permissions: ['perm_1', 'perm_2', 'perm_3', 'perm_6', 'perm_8'],
    level: 'user',
    departmentId: 'dept_1',
    isActive: true,
    assignedUsers: 6,
    createdAt: '2023-01-20T10:00:00Z',
    updatedAt: '2024-08-10T11:20:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'role_3',
    name: 'Compliance Officer',
    description: 'Ensures regulatory compliance and manages audit processes. Has specialized access to compliance and audit features.',
    permissions: ['perm_1', 'perm_3', 'perm_6', 'perm_8', 'perm_10', 'perm_11'],
    level: 'manager',
    departmentId: 'dept_2',
    isActive: true,
    assignedUsers: 3,
    createdAt: '2023-02-05T11:00:00Z',
    updatedAt: '2024-07-25T13:30:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'role_4',
    name: 'QA Engineer',
    description: 'Quality assurance engineer responsible for testing document workflows and ensuring system reliability.',
    permissions: ['perm_1', 'perm_2', 'perm_6', 'perm_8'],
    level: 'user',
    departmentId: 'dept_3',
    isActive: true,
    assignedUsers: 5,
    createdAt: '2023-03-15T12:00:00Z',
    updatedAt: '2024-08-05T16:10:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'role_5',
    name: 'Security Analyst',
    description: 'Information security analyst with specialized permissions for security monitoring and system administration.',
    permissions: ['perm_1', 'perm_6', 'perm_7', 'perm_8', 'perm_9', 'perm_11', 'perm_12'],
    level: 'manager',
    departmentId: 'dept_4',
    isActive: true,
    assignedUsers: 4,
    createdAt: '2023-04-10T13:30:00Z',
    updatedAt: '2024-08-01T09:45:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'role_6',
    name: 'Technical Writer',
    description: 'Technical documentation specialist responsible for creating and maintaining system documentation.',
    permissions: ['perm_1', 'perm_2', 'perm_3', 'perm_6'],
    level: 'user',
    departmentId: 'dept_5',
    isActive: false,
    assignedUsers: 2,
    createdAt: '2023-05-25T15:00:00Z',
    updatedAt: '2024-06-30T17:20:00Z',
    createdBy: 'admin@company.com'
  },
  {
    id: 'role_7',
    name: 'System Administrator',
    description: 'Full system administrator with complete access to all system features and administrative functions.',
    permissions: ['perm_1', 'perm_2', 'perm_3', 'perm_4', 'perm_5', 'perm_6', 'perm_7', 'perm_8', 'perm_9', 'perm_10', 'perm_11', 'perm_12'],
    level: 'admin',
    isActive: true,
    assignedUsers: 2,
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: '2024-08-19T10:00:00Z',
    createdBy: 'system@company.com'
  }
];

export const ROLE_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
] as const;

export const DEPARTMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
] as const;

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'userCount_desc', label: 'Most Users' },
  { value: 'userCount_asc', label: 'Fewest Users' }
] as const;
