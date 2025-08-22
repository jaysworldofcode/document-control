"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  ShieldCheck,
  Eye,
  UserMinus,
  Building
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Database user interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // computed: firstName + ' ' + lastName
  email: string;
  role: string;
  department: string;
  status: string;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  departmentId?: string;
  roleId?: string;
  location?: string;
}

export function UsersList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    departmentId: "",
    roleId: "",
    location: ""
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch users
        const usersResponse = await fetch('/api/users', {
          credentials: 'include',
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Map users to include firstName, lastName, and name
          setUsers(usersData.users.map((u: any) => ({
            ...u,
            firstName: u.firstName || u.first_name || u.name?.split(' ')[0] || '',
            lastName: u.lastName || u.last_name || u.name?.split(' ').slice(1).join(' ') || '',
            name: (u.firstName || u.first_name || u.name?.split(' ')[0] || '') + ' ' + (u.lastName || u.last_name || u.name?.split(' ').slice(1).join(' ') || ''),
          })));
        }

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

  const filteredUsers = users.filter(userData => {
    const matchesSearch = userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userData.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || userData.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || userData.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departmentNames = departments.map(dept => dept.name);

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          phone: newUser.phone,
          role: newUser.role || 'member',
          departmentId: newUser.departmentId || null,
          roleId: newUser.roleId || null,
          location: newUser.location,
          sendCredentials: false // Set to false since we're providing a password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prev => [...prev, data.user]);
        
        // Show success message
        if (data.user.tempCredentials) {
          // Auto-generated credentials
          toast({
            title: "User created successfully",
            description: `Login credentials: ${data.user.tempCredentials.username} / ${data.user.tempCredentials.password}`,
          });
        } else {
          // User-provided password
          toast({
            title: "User created successfully",
            description: "The user has been added to your organization and can login with their email and the password you set.",
          });
        }
        
        setIsAddUserOpen(false);
        resetNewUserForm();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Creation failed",
          description: error.error || 'Failed to create user',
        });
      }
    } catch (error) {
      console.error('User creation error:', error);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: "An unexpected error occurred while creating the user.",
      });
    }
  };

  // Action handlers
  const handleViewProfile = (userData: User) => {
    setSelectedUser(userData);
    setIsViewProfileOpen(true);
  };

  const openEditDialog = (userData: User) => {
    setSelectedUser(userData);
    setEditingUser(userData);
    setIsEditUserOpen(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          department: editingUser.department,
          role: editingUser.role,
          status: editingUser.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update the users list
      setUsers(users.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));
      
      setIsEditUserOpen(false);
      setEditingUser(null);
      
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userData: User) => {
    setSelectedUser(userData);
    setIsDeleteUserOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        toast({
          title: "User deleted",
          description: "The user has been deleted successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: error.error || 'Failed to delete user',
        });
      }
    } catch (error) {
      console.error('User deletion error:', error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "An unexpected error occurred while deleting the user.",
      });
    } finally {
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          departmentId: newUser.departmentId || null,
          roleId: newUser.roleId || null,
          location: newUser.location
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? data.user : u
        ));
        toast({
          title: "User updated",
          description: "The user has been updated successfully.",
        });
        setIsEditUserOpen(false);
        setSelectedUser(null);
        resetNewUserForm();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.error || 'Failed to update user',
        });
      }
    } catch (error) {
      console.error('User update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred while updating the user.",
      });
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: "",
      departmentId: "",
      roleId: "",
      location: ""
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper to get full name from user object
  const getFullName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    return user.name;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage team members and their project assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account and assign them to projects.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={newUser.departmentId} onValueChange={(value) => setNewUser(prev => ({ ...prev, departmentId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Custom Role (Optional)</Label>
                    <Select value={newUser.roleId} onValueChange={(value) => setNewUser(prev => ({ ...prev, roleId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a custom role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No custom role</SelectItem>
                        {roles.filter(role => !role.permissions.admin).map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={newUser.location}
                    onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="New York, NY"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddUser}
                  disabled={!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim() || !newUser.password.trim()}
                >
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Department
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDepartmentFilter("all")}>
                All Departments
              </DropdownMenuItem>
              {departmentNames.map((dept) => (
                <DropdownMenuItem key={dept} onClick={() => setDepartmentFilter(dept)}>
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((userData) => (
          <div
            key={userData.id}
            className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(userData.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{userData.name}</h3>
                    <Badge variant={userData.status === 'active' ? 'default' : 'secondary'}>
                      {userData.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      {userData.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{userData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{userData.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(userData.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground mb-1">Permissions</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(userData.permissions).map(([permission, enabled]) => 
                        enabled && (
                          <span
                            key={permission}
                            className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                          >
                            {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )
                      )}
                      {Object.values(userData.permissions).every(p => !p) && (
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                          Basic access
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewProfile(userData)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  {(user.role === 'owner' || user.role === 'admin') && (
                    <>
                      <DropdownMenuItem onClick={() => openEditDialog(userData)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => handleDeleteUser(userData)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <UserPlus className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by adding your first team member."}
          </p>
          {!searchTerm && statusFilter === "all" && departmentFilter === "all" && (
            <Button onClick={() => setIsAddUserOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      )}

      {/* View Profile Dialog */}
      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.role}</p>
                  <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                    {selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Join Date</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedUser.updated_at)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Permissions</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(selectedUser.permissions).map(([permission, enabled]) => 
                    enabled && (
                      <Badge key={permission} variant="outline">
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )
                  )}
                  {Object.values(selectedUser.permissions).every(p => !p) && (
                    <Badge variant="outline">Basic access</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      firstName: e.target.value,
                      name: `${e.target.value} ${editingUser.lastName}`.trim(),
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      lastName: e.target.value,
                      name: `${editingUser.firstName} ${e.target.value}`.trim(),
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    email: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({
                      ...editingUser,
                      role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={editingUser.department}
                    onValueChange={(value) => setEditingUser({
                      ...editingUser,
                      department: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value) => setEditingUser({
                    ...editingUser,
                    status: value as 'active' | 'inactive'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              The user will be permanently removed from the system and their access will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
