import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Role, 
  Department, 
  Permission,
  RoleDepartmentFilters, 
  SortConfig,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreateDepartmentRequest,
  UpdateDepartmentRequest
} from '@/types/role-department.types';
import * as roleService from '@/lib/role-department';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await roleService.getPermissions();
      setPermissions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions
  };
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = useCallback(async (data: CreateRoleRequest): Promise<Role> => {
    setLoading(true);
    setError(null);
    
    try {
      const newRole = await roleService.createRole(data);
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
      const updatedRole = await roleService.updateRole(id, data);
      setRoles(prev => prev.map(role => role.id === id ? updatedRole : role));
      return updatedRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await roleService.deleteRole(id);
      setRoles(prev => prev.filter(role => role.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRoleStatus = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await roleService.toggleRoleStatus(id);
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
    refetch: fetchRoles,
    setError
  };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await roleService.getDepartments();
      setDepartments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = useCallback(async (data: CreateDepartmentRequest): Promise<Department> => {
    setLoading(true);
    setError(null);
    
    try {
      const newDepartment = await roleService.createDepartment(data);
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
      const updatedDepartment = await roleService.updateDepartment(id, data);
      setDepartments(prev => prev.map(dept => dept.id === id ? updatedDepartment : dept));
      return updatedDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDepartment = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await roleService.deleteDepartment(id);
      setDepartments(prev => prev.filter(dept => dept.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDepartmentStatus = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await roleService.toggleDepartmentStatus(id);
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
    refetch: fetchDepartments,
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
