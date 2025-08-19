"use client";

import React, { useState } from 'react';
import { AppLayout } from "@/components/layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleForm } from "@/components/forms/role-form";
import { DepartmentForm } from "@/components/forms/department-form";
import { useRoles, useDepartments, useRoleDepartmentFilters } from "@/hooks/useRoleDepartment";
import { Role, Department, RoleFormData, DepartmentFormData, CreateDepartmentRequest } from "@/types/role-department.types";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Building, 
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function RoleDepartmentPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>();
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);

  // Custom hooks for data management
  const {
    roles,
    loading: rolesLoading,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus
  } = useRoles();

  const {
    departments,
    loading: departmentsLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus
  } = useDepartments();

  const {
    roleFilters,
    departmentFilters,
    updateRoleFilters,
    updateDepartmentFilters,
    filteredRoles,
    filteredDepartments
  } = useRoleDepartmentFilters(roles, departments);

  // Role form handlers
  const handleCreateRole = () => {
    setSelectedRole(undefined);
    setIsRoleFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleFormOpen(true);
  };

  const handleRoleSubmit = async (data: RoleFormData) => {
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, data);
        toast.success('Role updated successfully');
      } else {
        await createRole(data);
        toast.success('Role created successfully');
      }
      setIsRoleFormOpen(false);
    } catch (error) {
      toast.error('Failed to save role');
      throw error;
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        await deleteRole(role.id);
        toast.success('Role deleted successfully');
      } catch (error) {
        toast.error('Failed to delete role');
      }
    }
  };

  const handleToggleRoleStatus = async (role: Role) => {
    try {
      await toggleRoleStatus(role.id);
      toast.success(`Role ${role.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update role status');
    }
  };

  // Department form handlers
  const handleCreateDepartment = () => {
    setSelectedDepartment(undefined);
    setIsDepartmentFormOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDepartmentFormOpen(true);
  };

  const handleDepartmentSubmit = async (data: DepartmentFormData) => {
    try {
      const departmentData = {
        name: data.name,
        description: data.description,
        headOfDepartment: data.headOfDepartment || undefined,
        parentDepartmentId: data.parentDepartmentId || undefined,
        location: data.location || undefined,
        budget: data.budget ? parseFloat(data.budget) : undefined
      };

      if (selectedDepartment) {
        await updateDepartment(selectedDepartment.id, departmentData);
        toast.success('Department updated successfully');
      } else {
        await createDepartment(departmentData);
        toast.success('Department created successfully');
      }
      setIsDepartmentFormOpen(false);
    } catch (error) {
      toast.error('Failed to save department');
      throw error;
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (confirm(`Are you sure you want to delete the department "${department.name}"?`)) {
      try {
        await deleteDepartment(department.id);
        toast.success('Department deleted successfully');
      } catch (error) {
        toast.error('Failed to delete department');
      }
    }
  };

  const handleToggleDepartmentStatus = async (department: Department) => {
    try {
      await toggleDepartmentStatus(department.id);
      toast.success(`Department ${department.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update department status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Role & Department Management</h1>
            <p className="text-muted-foreground">
              Manage organizational roles and department structure
            </p>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Departments ({departments.length})
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>
                    Manage user roles and permissions
                  </CardDescription>
                </div>
                <Button onClick={handleCreateRole}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roles..."
                    value={roleFilters.search}
                    onChange={(e) => updateRoleFilters({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={roleFilters.status}
                  onValueChange={(value) => updateRoleFilters({ status: value as any })}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Roles Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {role.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 2).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            role.level === 'admin' ? 'destructive' :
                            role.level === 'manager' ? 'default' : 'secondary'
                          }>
                            {role.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? 'default' : 'secondary'}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{role.assignedUsers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleRoleStatus(role)}>
                                {role.isActive ? (
                                  <>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRole(role)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>
                    Manage organizational departments and structure
                  </CardDescription>
                </div>
                <Button onClick={handleCreateDepartment}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Department Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search departments..."
                    value={departmentFilters.search}
                    onChange={(e) => updateDepartmentFilters({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={departmentFilters.status}
                  onValueChange={(value) => updateDepartmentFilters({ status: value as any })}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Departments Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Head</TableHead>
                      <TableHead>Parent Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>
                          {department.headOfDepartment || (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {department.parentDepartmentId ? (
                            departments.find(d => d.id === department.parentDepartmentId)?.name || 'Unknown'
                          ) : (
                            <span className="text-muted-foreground">Root department</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {department.location || (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {department.budget ? formatCurrency(department.budget) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={department.isActive ? 'default' : 'secondary'}>
                            {department.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{department.userCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditDepartment(department)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleDepartmentStatus(department)}>
                                {department.isActive ? (
                                  <>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Building className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteDepartment(department)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Form Dialog */}
      <RoleForm
        isOpen={isRoleFormOpen}
        onClose={() => setIsRoleFormOpen(false)}
        onSubmit={handleRoleSubmit}
        departments={departments}
        role={selectedRole}
        loading={rolesLoading}
      />

      {/* Department Form Dialog */}
      <DepartmentForm
        isOpen={isDepartmentFormOpen}
        onClose={() => setIsDepartmentFormOpen(false)}
        onSubmit={handleDepartmentSubmit}
        departments={departments}
        department={selectedDepartment}
        loading={departmentsLoading}
      />
      </div>
    </AppLayout>
  );
}
