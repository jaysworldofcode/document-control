import { createClient } from '@/lib/supabase'
import { Role, Department, Permission, CreateRoleRequest, CreateDepartmentRequest } from '@/types/role-department.types'
import { PERMISSIONS, MOCK_DEPARTMENTS, MOCK_ROLES } from '@/constants/role-department.constants'

const supabase = createClient()

// Helper function to check if database tables exist
const checkDatabaseConnection = async () => {
  try {
    const { error } = await supabase.from('permissions').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Permission functions
export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, using mock permissions')
      return PERMISSIONS
    }

    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching permissions:', error)
      console.warn('Falling back to mock permissions')
      return PERMISSIONS
    }

    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      resource: p.resource,
      action: p.action
    }))
  } catch (err) {
    console.error('Error in getPermissions:', err)
    return PERMISSIONS
  }
}

// Department functions
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, using mock departments')
      return MOCK_DEPARTMENTS
    }

    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        user_count:user_departments(count),
        role_count:roles(count)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching departments:', error)
      console.warn('Falling back to mock departments')
      return MOCK_DEPARTMENTS
    }

    return data.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description || '',
      headOfDepartment: d.head_of_department,
      parentDepartmentId: d.parent_department_id,
      location: d.location,
      budget: d.budget,
      isActive: d.is_active,
      userCount: Array.isArray(d.user_count) ? d.user_count.length : 0,
      roleCount: Array.isArray(d.role_count) ? d.role_count.length : 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      createdBy: d.created_by
    }))
  } catch (err) {
    console.error('Error in getDepartments:', err)
    return MOCK_DEPARTMENTS
  }
}

export const createDepartment = async (data: CreateDepartmentRequest): Promise<Department> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating department creation')
      // Simulate creation with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        id: `dept_${Date.now()}`,
        name: data.name,
        description: data.description || '',
        headOfDepartment: data.headOfDepartment,
        parentDepartmentId: data.parentDepartmentId,
        location: data.location,
        budget: data.budget,
        isActive: true,
        userCount: 0,
        roleCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'mock-user'
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: newDept, error } = await supabase
      .from('departments')
      .insert({
        name: data.name,
        description: data.description,
        head_of_department: data.headOfDepartment,
        parent_department_id: data.parentDepartmentId || null,
        location: data.location,
        budget: data.budget,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating department:', error)
      throw new Error(error.message)
    }

    return {
      id: newDept.id,
      name: newDept.name,
      description: newDept.description || '',
      headOfDepartment: newDept.head_of_department,
      parentDepartmentId: newDept.parent_department_id,
      location: newDept.location,
      budget: newDept.budget,
      isActive: newDept.is_active,
      userCount: 0,
      roleCount: 0,
      createdAt: newDept.created_at,
      updatedAt: newDept.updated_at,
      createdBy: newDept.created_by
    }
  } catch (err) {
    console.error('Error in createDepartment:', err)
    throw err
  }
}

export const updateDepartment = async (id: string, data: Partial<CreateDepartmentRequest>): Promise<Department> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating department update')
      await new Promise(resolve => setTimeout(resolve, 800))
      // Return mock updated department
      const mockDept = MOCK_DEPARTMENTS.find(d => d.id === id)
      if (!mockDept) throw new Error('Department not found')
      
      return {
        ...mockDept,
        name: data.name || mockDept.name,
        description: data.description || mockDept.description,
        headOfDepartment: data.headOfDepartment || mockDept.headOfDepartment,
        parentDepartmentId: data.parentDepartmentId !== undefined ? data.parentDepartmentId : mockDept.parentDepartmentId,
        location: data.location || mockDept.location,
        budget: data.budget || mockDept.budget,
        updatedAt: new Date().toISOString()
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.headOfDepartment !== undefined) updateData.head_of_department = data.headOfDepartment
    if (data.parentDepartmentId !== undefined) updateData.parent_department_id = data.parentDepartmentId || null
    if (data.location !== undefined) updateData.location = data.location
    if (data.budget !== undefined) updateData.budget = data.budget

    const { data: updatedDept, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user_count:user_departments(count),
        role_count:roles(count)
      `)
      .single()

    if (error) {
      console.error('Error updating department:', error)
      throw new Error(error.message)
    }

    return {
      id: updatedDept.id,
      name: updatedDept.name,
      description: updatedDept.description || '',
      headOfDepartment: updatedDept.head_of_department,
      parentDepartmentId: updatedDept.parent_department_id,
      location: updatedDept.location,
      budget: updatedDept.budget,
      isActive: updatedDept.is_active,
      userCount: Array.isArray(updatedDept.user_count) ? updatedDept.user_count.length : 0,
      roleCount: Array.isArray(updatedDept.role_count) ? updatedDept.role_count.length : 0,
      createdAt: updatedDept.created_at,
      updatedAt: updatedDept.updated_at,
      createdBy: updatedDept.created_by
    }
  } catch (err) {
    console.error('Error in updateDepartment:', err)
    throw err
  }
}

export const deleteDepartment = async (id: string): Promise<void> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating department deletion')
      await new Promise(resolve => setTimeout(resolve, 500))
      // Simulate validation
      const mockDept = MOCK_DEPARTMENTS.find(d => d.id === id)
      if (mockDept && (mockDept.userCount > 0 || mockDept.roleCount > 0)) {
        throw new Error('Cannot delete department that has assigned users or roles')
      }
      return
    }

    // Check if department has users or roles
    const { count: userCount } = await supabase
      .from('user_departments')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', id)

    const { count: roleCount } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', id)

    if ((userCount || 0) > 0 || (roleCount || 0) > 0) {
      throw new Error('Cannot delete department that has assigned users or roles')
    }

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting department:', error)
      throw new Error(error.message)
    }
  } catch (err) {
    console.error('Error in deleteDepartment:', err)
    throw err
  }
}

export const toggleDepartmentStatus = async (id: string): Promise<void> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating department status toggle')
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }

    // Get current status
    const { data: dept, error: fetchError } = await supabase
      .from('departments')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching department:', fetchError)
      throw new Error(fetchError.message)
    }

    const { error } = await supabase
      .from('departments')
      .update({ 
        is_active: !dept.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error toggling department status:', error)
      throw new Error(error.message)
    }
  } catch (err) {
    console.error('Error in toggleDepartmentStatus:', err)
    throw err
  }
}

// Role functions
export const getRoles = async (): Promise<Role[]> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, using mock roles')
      return MOCK_ROLES
    }

    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        department:departments(name),
        permissions:role_permissions(permission:permissions(*)),
        user_count:user_roles(count)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching roles:', error)
      console.warn('Falling back to mock roles')
      return MOCK_ROLES
    }

    return data.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      permissions: r.permissions?.map((rp: any) => rp.permission?.id).filter(Boolean) || [],
      level: r.level,
      departmentId: r.department_id,
      isActive: r.is_active,
      assignedUsers: Array.isArray(r.user_count) ? r.user_count.length : 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by
    }))
  } catch (err) {
    console.error('Error in getRoles:', err)
    return MOCK_ROLES
  }
}

export const createRole = async (data: CreateRoleRequest): Promise<Role> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating role creation')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        id: `role_${Date.now()}`,
        name: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
        level: data.level,
        departmentId: data.departmentId,
        isActive: true,
        assignedUsers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'mock-user'
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Create the role
    const { data: newRole, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: data.name,
        description: data.description,
        level: data.level,
        department_id: data.departmentId || null,
        created_by: user.id
      })
      .select()
      .single()

    if (roleError) {
      console.error('Error creating role:', roleError)
      throw new Error(roleError.message)
    }

    // Assign permissions to the role
    if (data.permissions && data.permissions.length > 0) {
      const permissionAssignments = data.permissions.map(permissionId => ({
        role_id: newRole.id,
        permission_id: permissionId
      }))

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(permissionAssignments)

      if (permError) {
        console.error('Error assigning permissions:', permError)
        // Clean up the role if permission assignment fails
        await supabase.from('roles').delete().eq('id', newRole.id)
        throw new Error(permError.message)
      }
    }

    return {
      id: newRole.id,
      name: newRole.name,
      description: newRole.description || '',
      permissions: data.permissions || [],
      level: newRole.level,
      departmentId: newRole.department_id,
      isActive: newRole.is_active,
      assignedUsers: 0,
      createdAt: newRole.created_at,
      updatedAt: newRole.updated_at,
      createdBy: newRole.created_by
    }
  } catch (err) {
    console.error('Error in createRole:', err)
    throw err
  }
}

export const updateRole = async (id: string, data: Partial<CreateRoleRequest>): Promise<Role> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating role update')
      await new Promise(resolve => setTimeout(resolve, 800))
      const mockRole = MOCK_ROLES.find(r => r.id === id)
      if (!mockRole) throw new Error('Role not found')
      
      return {
        ...mockRole,
        name: data.name || mockRole.name,
        description: data.description || mockRole.description,
        permissions: data.permissions || mockRole.permissions,
        level: data.level || mockRole.level,
        departmentId: data.departmentId !== undefined ? data.departmentId : mockRole.departmentId,
        updatedAt: new Date().toISOString()
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.level !== undefined) updateData.level = data.level
    if (data.departmentId !== undefined) updateData.department_id = data.departmentId || null

    const { data: updatedRole, error: roleError } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (roleError) {
      console.error('Error updating role:', roleError)
      throw new Error(roleError.message)
    }

    // Update permissions if provided
    if (data.permissions !== undefined) {
      // Remove existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id)

      // Add new permissions
      if (data.permissions.length > 0) {
        const permissionAssignments = data.permissions.map(permissionId => ({
          role_id: id,
          permission_id: permissionId
        }))

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(permissionAssignments)

        if (permError) {
          console.error('Error updating permissions:', permError)
          throw new Error(permError.message)
        }
      }
    }

    // Get the current user count
    const { count: userCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)

    return {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description || '',
      permissions: data.permissions || [],
      level: updatedRole.level,
      departmentId: updatedRole.department_id,
      isActive: updatedRole.is_active,
      assignedUsers: userCount || 0,
      createdAt: updatedRole.created_at,
      updatedAt: updatedRole.updated_at,
      createdBy: updatedRole.created_by
    }
  } catch (err) {
    console.error('Error in updateRole:', err)
    throw err
  }
}

export const deleteRole = async (id: string): Promise<void> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating role deletion')
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockRole = MOCK_ROLES.find(r => r.id === id)
      if (mockRole && mockRole.assignedUsers > 0) {
        throw new Error('Cannot delete role that has assigned users')
      }
      return
    }

    // Check if role has assigned users
    const { count: userCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)

    if ((userCount || 0) > 0) {
      throw new Error('Cannot delete role that has assigned users')
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting role:', error)
      throw new Error(error.message)
    }
  } catch (err) {
    console.error('Error in deleteRole:', err)
    throw err
  }
}

export const toggleRoleStatus = async (id: string): Promise<void> => {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('Database not connected, simulating role status toggle')
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }

    // Get current status
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching role:', fetchError)
      throw new Error(fetchError.message)
    }

    const { error } = await supabase
      .from('roles')
      .update({ 
        is_active: !role.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error toggling role status:', error)
      throw new Error(error.message)
    }
  } catch (err) {
    console.error('Error in toggleRoleStatus:', err)
    throw err
  }
}
