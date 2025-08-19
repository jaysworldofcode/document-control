import { useState, useCallback, useMemo } from 'react';
import { 
  Role, 
  Department, 
  RoleDepartmentFilters, 
  SortConfig,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreateDepartmentRequest,
  UpdateDepartmentRequest
} from '@/types/role-department.types';
import { MOCK_ROLES, MOCK_DEPARTMENTS } from '@/constants/role-department.constants';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRole = useCallback(async (data: CreateRoleRequest): Promise<Role> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        level: data.level,
        departmentId: data.departmentId,
        isActive: true,
        assignedUsers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user@company.com'
      };
      
      setRoles(prev => [...prev, newRole]);
      return newRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (id: string, data: Partial<CreateRoleRequest>): Promise<Role> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const existingRole = roles.find(r => r.id === id);
      if (!existingRole) {
        throw new Error('Role not found');
      }
      
      const updatedRole: Role = {
        ...existingRole,
        name: data.name || existingRole.name,
        description: data.description || existingRole.description,
        permissions: data.permissions || existingRole.permissions,
        level: data.level || existingRole.level,
        departmentId: data.departmentId !== undefined ? data.departmentId : existingRole.departmentId,
        updatedAt: new Date().toISOString()
      };
      
      setRoles(prev => prev.map(role => role.id === id ? updatedRole : role));
      return updatedRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [roles]);

  const deleteRole = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const roleToDelete = roles.find(r => r.id === id);
      if (roleToDelete && roleToDelete.assignedUsers > 0) {
        throw new Error('Cannot delete role that has assigned users');
      }
      
      setRoles(prev => prev.filter(role => role.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [roles]);

  const toggleRoleStatus = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRoles(prev => prev.map(role => 
        role.id === id 
          ? { ...role, isActive: !role.isActive, updatedAt: new Date().toISOString() }
          : role
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle role status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    setError
  };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDepartment = useCallback(async (data: CreateDepartmentRequest): Promise<Department> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDepartment: Department = {
        id: `dept_${Date.now()}`,
        name: data.name,
        description: data.description,
        headOfDepartment: data.headOfDepartment,
        parentDepartmentId: data.parentDepartmentId || undefined,
        location: data.location,
        budget: data.budget,
        isActive: true,
        userCount: 0,
        roleCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user@company.com'
      };
      
      setDepartments(prev => [...prev, newDepartment]);
      return newDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDepartment = useCallback(async (id: string, data: Partial<CreateDepartmentRequest>): Promise<Department> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const existingDepartment = departments.find(d => d.id === id);
      if (!existingDepartment) {
        throw new Error('Department not found');
      }
      
      const updatedDepartment: Department = {
        ...existingDepartment,
        name: data.name || existingDepartment.name,
        description: data.description || existingDepartment.description,
        headOfDepartment: data.headOfDepartment,
        parentDepartmentId: data.parentDepartmentId,
        location: data.location,
        budget: data.budget,
        updatedAt: new Date().toISOString()
      };
      
      setDepartments(prev => prev.map(dept => dept.id === id ? updatedDepartment : dept));
      return updatedDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [departments]);

  const deleteDepartment = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const deptToDelete = departments.find(d => d.id === id);
      if (deptToDelete && (deptToDelete.userCount > 0 || deptToDelete.roleCount > 0)) {
        throw new Error('Cannot delete department that has assigned users or roles');
      }
      
      setDepartments(prev => prev.filter(dept => dept.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [departments]);

  const toggleDepartmentStatus = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDepartments(prev => prev.map(dept => 
        dept.id === id 
          ? { ...dept, isActive: !dept.isActive, updatedAt: new Date().toISOString() }
          : dept
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle department status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    departments,
    loading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus,
    setError
  };
}

export function useRoleDepartmentFilters(roles: Role[], departments: Department[]) {
  const [roleFilters, setRoleFilters] = useState<RoleDepartmentFilters>({
    search: '',
    status: 'all'
  });

  const [departmentFilters, setDepartmentFilters] = useState<RoleDepartmentFilters>({
    search: '',
    status: 'all'
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'name',
    direction: 'asc'
  });

  const updateRoleFilters = useCallback(<K extends keyof RoleDepartmentFilters>(
    updates: Partial<RoleDepartmentFilters>
  ) => {
    setRoleFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDepartmentFilters = useCallback(<K extends keyof RoleDepartmentFilters>(
    updates: Partial<RoleDepartmentFilters>
  ) => {
    setDepartmentFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSort = useCallback((key: SortConfig['key'], direction?: SortConfig['direction']) => {
    setSortConfig(prev => ({
      key,
      direction: direction || (prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc')
    }));
  }, []);

  const filteredRoles = useMemo(() => {
    let filtered = roles.filter(item => {
      // Search filter
      const matchesSearch = !roleFilters.search || 
        item.name.toLowerCase().includes(roleFilters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(roleFilters.search.toLowerCase());
      
      // Status filter
      const matchesStatus = roleFilters.status === 'all' || 
        (roleFilters.status === 'active' && item.isActive) ||
        (roleFilters.status === 'inactive' && !item.isActive);
      
      return matchesSearch && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Role];
      const bValue = b[sortConfig.key as keyof Role];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? result : -result;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortConfig.direction === 'asc' ? result : -result;
      }
      
      return 0;
    });

    return filtered;
  }, [roles, roleFilters, sortConfig]);

  const filteredDepartments = useMemo(() => {
    let filtered = departments.filter(item => {
      // Search filter
      const matchesSearch = !departmentFilters.search || 
        item.name.toLowerCase().includes(departmentFilters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(departmentFilters.search.toLowerCase());
      
      // Status filter
      const matchesStatus = departmentFilters.status === 'all' || 
        (departmentFilters.status === 'active' && item.isActive) ||
        (departmentFilters.status === 'inactive' && !item.isActive);
      
      return matchesSearch && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Department];
      const bValue = b[sortConfig.key as keyof Department];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? result : -result;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortConfig.direction === 'asc' ? result : -result;
      }
      
      return 0;
    });

    return filtered;
  }, [departments, departmentFilters, sortConfig]);

  return {
    roleFilters,
    departmentFilters,
    updateRoleFilters,
    updateDepartmentFilters,
    updateSort,
    filteredRoles,
    filteredDepartments,
    sortConfig
  };
}
