"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  Users,
  Shield,
  Check,
  X,
  Loader2,
  Edit,
  Trash2,
  Plus,
  Building,
  UserCheck,
  AlertCircle
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  manager_id: string | null;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  budget: number | null;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  permissions: Record<string, boolean>;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export default function RoleDepartmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'department' | 'role', id: string, name: string } | null>(null);

  // Department form state
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    description: "",
    managerId: "",
    budget: "",
  });

  // Role form state
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: {
      admin: false,
      manage_users: false,
      manage_departments: false,
      manage_roles: false,
      manage_organization: false,
      manage_documents: false,
      view_reports: false,
    },
  });

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch departments
        const deptResponse = await fetch('/api/departments', {
          credentials: 'include',
        });

        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.departments);
        }

        // Fetch roles
        const rolesResponse = await fetch('/api/roles', {
          credentials: 'include',
        });

        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          setRoles(rolesData.roles);
        }

        // Fetch organization members for department managers
        const orgResponse = await fetch('/api/organizations', {
          credentials: 'include',
        });

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setMembers(orgData.members);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, toast]);

  // Department handlers
  const handleCreateDepartment = async () => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: departmentForm.name,
          description: departmentForm.description,
          managerId: (departmentForm.managerId && departmentForm.managerId !== "none") ? departmentForm.managerId : null,
          budget: departmentForm.budget ? parseFloat(departmentForm.budget) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(prev => [...prev, data.department]);
        setDepartmentForm({ name: "", description: "", managerId: "", budget: "" });
        setIsAddingDepartment(false);
        toast({
          title: "Department created",
          description: "The department has been created successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Creation failed",
          description: error.error || 'Failed to create department',
        });
      }
    } catch (error) {
      console.error('Department creation error:', error);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: "An unexpected error occurred while creating the department.",
      });
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;
    
    try {
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: departmentForm.name,
          description: departmentForm.description,
          managerId: (departmentForm.managerId && departmentForm.managerId !== "none") ? departmentForm.managerId : null,
          budget: departmentForm.budget ? parseFloat(departmentForm.budget) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(prev => prev.map(dept => 
          dept.id === editingDepartment.id ? data.department : dept
        ));
        setDepartmentForm({ name: "", description: "", managerId: "", budget: "" });
        setEditingDepartment(null);
        toast({
          title: "Department updated",
          description: "The department has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.error || 'Failed to update department',
        });
      }
    } catch (error) {
      console.error('Department update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred while updating the department.",
      });
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
        toast({
          title: "Department deleted",
          description: "The department has been deleted successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: error.error || 'Failed to delete department',
        });
      }
    } catch (error) {
      console.error('Department deletion error:', error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "An unexpected error occurred while deleting the department.",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Role handlers
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(prev => [...prev, data.role]);
        setRoleForm({
          name: "",
          description: "",
          permissions: {
            admin: false,
            manage_users: false,
            manage_departments: false,
            manage_roles: false,
            manage_organization: false,
            manage_documents: false,
            view_reports: false,
          },
        });
        setIsAddingRole(false);
        toast({
          title: "Role created",
          description: "The role has been created successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Creation failed",
          description: error.error || 'Failed to create role',
        });
      }
    } catch (error) {
      console.error('Role creation error:', error);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: "An unexpected error occurred while creating the role.",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    try {
      const response = await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(prev => prev.map(role => 
          role.id === editingRole.id ? data.role : role
        ));
        setRoleForm({
          name: "",
          description: "",
          permissions: {
            admin: false,
            manage_users: false,
            manage_departments: false,
            manage_roles: false,
            manage_organization: false,
            manage_documents: false,
            view_reports: false,
          },
        });
        setEditingRole(null);
        toast({
          title: "Role updated",
          description: "The role has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.error || 'Failed to update role',
        });
      }
    } catch (error) {
      console.error('Role update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred while updating the role.",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setRoles(prev => prev.filter(role => role.id !== roleId));
        toast({
          title: "Role deleted",
          description: "The role has been deleted successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: error.error || 'Failed to delete role',
        });
      }
    } catch (error) {
      console.error('Role deletion error:', error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "An unexpected error occurred while deleting the role.",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'department') {
      handleDeleteDepartment(itemToDelete.id);
    } else {
      handleDeleteRole(itemToDelete.id);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 p-6">
          {/* Skeleton page header */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-1/2 max-w-sm" />
          </div>
          
          {/* Skeleton tabs */}
          <Skeleton className="h-10 w-full max-w-md" />
          
          {/* Skeleton tab content */}
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Departments tab skeleton */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
              </div>
              
              {/* Department items skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="border p-4 rounded-lg mb-4 space-y-2">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Please log in to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Roles & Departments</h1>
            <p className="text-muted-foreground">
              Manage organizational structure, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {departments.length} Departments
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {roles.length} Roles
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="departments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Department Management
                  </CardTitle>
                  <Button 
                    onClick={() => setIsAddingDepartment(true)}
                    disabled={user.role !== 'owner' && user.role !== 'admin'}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Departments List */}
                  <div className="space-y-3">
                    {departments.map((department) => (
                      <div key={department.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{department.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {department.description || 'No description provided'}
                            </p>
                            {department.manager && (
                              <div className="flex items-center gap-1 mt-1">
                                <UserCheck className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-muted-foreground">
                                  Manager: {department.manager.first_name} {department.manager.last_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {department.budget && (
                            <Badge variant="outline" className="font-mono">
                              ${department.budget.toLocaleString()}
                            </Badge>
                          )}
                          {(user.role === 'owner' || user.role === 'admin') && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingDepartment(department);
                                  setDepartmentForm({
                                    name: department.name,
                                    description: department.description || "",
                                    managerId: department.manager_id || "none",
                                    budget: department.budget?.toString() || "",
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setItemToDelete({ type: 'department', id: department.id, name: department.name });
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {departments.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No departments found. Create your first department to get started.</p>
                      </div>
                    )}
                  </div>

                  {/* Add Department Form */}
                  {isAddingDepartment && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="dept-name">Department Name *</Label>
                              <Input
                                id="dept-name"
                                value={departmentForm.name}
                                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Information Technology"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dept-manager">Department Manager</Label>
                              <Select 
                                value={departmentForm.managerId} 
                                onValueChange={(value) => setDepartmentForm(prev => ({ ...prev, managerId: value === "none" ? "" : value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select manager (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No manager assigned</SelectItem>
                                  {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.first_name} {member.last_name} ({member.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="dept-description">Description</Label>
                            <Textarea
                              id="dept-description"
                              value={departmentForm.description}
                              onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of this department's responsibilities"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dept-budget">Annual Budget (USD)</Label>
                            <Input
                              id="dept-budget"
                              type="number"
                              value={departmentForm.budget}
                              onChange={(e) => setDepartmentForm(prev => ({ ...prev, budget: e.target.value }))}
                              placeholder="e.g. 500000"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleCreateDepartment}
                              disabled={!departmentForm.name.trim()}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Create Department
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsAddingDepartment(false);
                                setDepartmentForm({ name: "", description: "", managerId: "", budget: "" });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Edit Department Form */}
                  {editingDepartment && (
                    <Card className="border-dashed border-orange-200 bg-orange-50/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-orange-700 mb-4">
                            <Edit className="h-4 w-4" />
                            <span className="font-medium">Editing: {editingDepartment.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-dept-name">Department Name *</Label>
                              <Input
                                id="edit-dept-name"
                                value={departmentForm.name}
                                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Department name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-dept-manager">Department Manager</Label>
                              <Select 
                                value={departmentForm.managerId} 
                                onValueChange={(value) => setDepartmentForm(prev => ({ ...prev, managerId: value === "none" ? "" : value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select manager" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No manager assigned</SelectItem>
                                  {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.first_name} {member.last_name} ({member.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-dept-description">Description</Label>
                            <Textarea
                              id="edit-dept-description"
                              value={departmentForm.description}
                              onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Department description"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-dept-budget">Annual Budget (USD)</Label>
                            <Input
                              id="edit-dept-budget"
                              type="number"
                              value={departmentForm.budget}
                              onChange={(e) => setDepartmentForm(prev => ({ ...prev, budget: e.target.value }))}
                              placeholder="Department budget"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleUpdateDepartment}
                              disabled={!departmentForm.name.trim()}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Update Department
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingDepartment(null);
                                setDepartmentForm({ name: "", description: "", managerId: "", budget: "" });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role Management
                  </CardTitle>
                  <Button 
                    onClick={() => setIsAddingRole(true)}
                    disabled={user.role !== 'owner'}
                    className="text-xs"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Roles List */}
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            role.is_system_role ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            <Shield className={`h-5 w-5 ${
                              role.is_system_role ? 'text-purple-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{role.name}</h3>
                              {role.is_system_role && <Badge variant="secondary">System</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {role.description || 'No description provided'}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(role.permissions).map(([permission, enabled]) => 
                                enabled && (
                                  <Badge key={permission} variant="outline" className="text-xs">
                                    {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {user.role === 'owner' && !role.is_system_role && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingRole(role);
                                  setRoleForm({
                                    name: role.name,
                                    description: role.description || "",
                                    permissions: {
                                      admin: role.permissions.admin || false,
                                      manage_users: role.permissions.manage_users || false,
                                      manage_departments: role.permissions.manage_departments || false,
                                      manage_roles: role.permissions.manage_roles || false,
                                      manage_organization: role.permissions.manage_organization || false,
                                      manage_documents: role.permissions.manage_documents || false,
                                      view_reports: role.permissions.view_reports || false,
                                    },
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setItemToDelete({ type: 'role', id: role.id, name: role.name });
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {roles.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No roles found. System roles will be created automatically.</p>
                      </div>
                    )}
                  </div>

                  {/* Add Role Form */}
                  {isAddingRole && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="role-name">Role Name *</Label>
                              <Input
                                id="role-name"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Project Manager"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role-description">Description</Label>
                              <Input
                                id="role-description"
                                value={roleForm.description}
                                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of this role"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                              {Object.entries(roleForm.permissions).map(([permission, enabled]) => (
                                <div key={permission} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={permission}
                                    checked={enabled}
                                    onCheckedChange={(checked) => 
                                      setRoleForm(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          [permission]: checked === true
                                        }
                                      }))
                                    }
                                  />
                                  <Label htmlFor={permission} className="text-sm cursor-pointer">
                                    {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleCreateRole}
                              disabled={!roleForm.name.trim()}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Create Role
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsAddingRole(false);
                                setRoleForm({
                                  name: "",
                                  description: "",
                                  permissions: {
                                    admin: false,
                                    manage_users: false,
                                    manage_departments: false,
                                    manage_roles: false,
                                    manage_organization: false,
                                    manage_documents: false,
                                    view_reports: false,
                                  },
                                });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Edit Role Form */}
                  {editingRole && (
                    <Card className="border-dashed border-orange-200 bg-orange-50/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-orange-700 mb-4">
                            <Edit className="h-4 w-4" />
                            <span className="font-medium">Editing: {editingRole.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-role-name">Role Name *</Label>
                              <Input
                                id="edit-role-name"
                                value={roleForm.name}
                                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Role name"
                                disabled={editingRole.is_system_role}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-role-description">Description</Label>
                              <Input
                                id="edit-role-description"
                                value={roleForm.description}
                                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Role description"
                                disabled={editingRole.is_system_role}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                              {Object.entries(roleForm.permissions).map(([permission, enabled]) => (
                                <div key={permission} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`edit-${permission}`}
                                    checked={enabled}
                                    disabled={editingRole.is_system_role}
                                    onCheckedChange={(checked) => 
                                      setRoleForm(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          [permission]: checked === true
                                        }
                                      }))
                                    }
                                  />
                                  <Label htmlFor={`edit-${permission}`} className="text-sm cursor-pointer">
                                    {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleUpdateRole}
                              disabled={!roleForm.name.trim() || editingRole.is_system_role}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Update Role
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingRole(null);
                                setRoleForm({
                                  name: "",
                                  description: "",
                                  permissions: {
                                    admin: false,
                                    manage_users: false,
                                    manage_departments: false,
                                    manage_roles: false,
                                    manage_organization: false,
                                    manage_documents: false,
                                    view_reports: false,
                                  },
                                });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
                {itemToDelete?.type === 'department' && " Users assigned to this department will be unassigned."}
                {itemToDelete?.type === 'role' && " Users with this role will need to be reassigned."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {itemToDelete?.type}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
