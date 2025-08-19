"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
  UserMinus
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Mock data for users
const mockUsers = [
  {
    id: 1,
    name: "Sarah Wilson",
    email: "sarah.wilson@company.com",
    phone: "+1 (555) 123-4567",
    role: "Project Manager",
    department: "Engineering",
    status: "active",
    avatar: "",
    joinDate: "2023-01-15",
    location: "New York, NY",
    projects: ["Document Management System v2.0", "API Documentation Portal"],
    permissions: ["read", "write", "admin"],
    lastActive: "2024-08-19T10:30:00Z"
  },
  {
    id: 2,
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "+1 (555) 234-5678",
    role: "Senior Developer",
    department: "Engineering",
    status: "active",
    avatar: "",
    joinDate: "2022-08-20",
    location: "San Francisco, CA",
    projects: ["Document Management System v2.0", "Security Enhancement Project"],
    permissions: ["read", "write"],
    lastActive: "2024-08-19T09:15:00Z"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    phone: "+1 (555) 345-6789",
    role: "Compliance Officer",
    department: "Legal",
    status: "active",
    avatar: "",
    joinDate: "2023-03-10",
    location: "Austin, TX",
    projects: ["Compliance Audit System"],
    permissions: ["read", "write", "admin"],
    lastActive: "2024-08-18T16:45:00Z"
  },
  {
    id: 4,
    name: "David Chen",
    email: "david.chen@company.com",
    phone: "+1 (555) 456-7890",
    role: "Technical Writer",
    department: "Documentation",
    status: "inactive",
    avatar: "",
    joinDate: "2023-06-05",
    location: "Seattle, WA",
    projects: ["API Documentation Portal"],
    permissions: ["read", "write"],
    lastActive: "2024-08-10T14:20:00Z"
  },
  {
    id: 5,
    name: "Lisa Garcia",
    email: "lisa.garcia@company.com",
    phone: "+1 (555) 567-8901",
    role: "QA Engineer",
    department: "Quality Assurance",
    status: "active",
    avatar: "",
    joinDate: "2022-11-30",
    location: "Chicago, IL",
    projects: ["Document Management System v2.0", "Compliance Audit System"],
    permissions: ["read", "write"],
    lastActive: "2024-08-19T11:00:00Z"
  },
  {
    id: 6,
    name: "Alex Kumar",
    email: "alex.kumar@company.com",
    phone: "+1 (555) 678-9012",
    role: "Security Analyst",
    department: "IT Security",
    status: "active",
    avatar: "",
    joinDate: "2023-09-12",
    location: "Boston, MA",
    projects: ["Security Enhancement Project"],
    permissions: ["read", "write", "admin"],
    lastActive: "2024-08-19T08:30:00Z"
  }
];

// Mock projects for assignment
const mockProjects = [
  { id: 1, name: "Document Management System v2.0", status: "active" },
  { id: 2, name: "API Documentation Portal", status: "active" },
  { id: 3, name: "Compliance Audit System", status: "pending" },
  { id: 4, name: "Security Enhancement Project", status: "active" },
  { id: 5, name: "Mobile App Integration", status: "planning" }
];

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  inactive: { label: "Inactive", variant: "secondary" as const },
};

const roleColors = {
  "Project Manager": "bg-blue-100 text-blue-800",
  "Senior Developer": "bg-green-100 text-green-800",
  "Compliance Officer": "bg-purple-100 text-purple-800",
  "Technical Writer": "bg-orange-100 text-orange-800",
  "QA Engineer": "bg-yellow-100 text-yellow-800",
  "Security Analyst": "bg-red-100 text-red-800",
};

interface NewUser {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  location: string;
  projects: string[];
  permissions: string[];
}

export function UsersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAssignProjectsOpen, setIsAssignProjectsOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState(mockUsers);
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    location: "",
    projects: [],
    permissions: ["read"]
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(users.map(user => user.department)));

  const handleAddUser = () => {
    // Here you would typically send the data to your API
    const newUserId = Math.max(...users.map(u => u.id)) + 1;
    const userToAdd = {
      id: newUserId,
      ...newUser,
      status: "active",
      avatar: "",
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString()
    };
    
    setUsers(prev => [...prev, userToAdd]);
    console.log("Adding user:", userToAdd);
    setIsAddUserOpen(false);
    resetNewUserForm();
  };

  const handleProjectToggle = (projectName: string) => {
    setNewUser(prev => ({
      ...prev,
      projects: prev.projects.includes(projectName)
        ? prev.projects.filter(p => p !== projectName)
        : [...prev.projects, projectName]
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Action handlers
  const handleViewProfile = (user: any) => {
    setSelectedUser(user);
    setIsViewProfileOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      location: user.location,
      projects: user.projects,
      permissions: user.permissions
    });
    setIsEditUserOpen(true);
  };

  const handleAssignProjects = (user: any) => {
    setSelectedUser(user);
    setIsAssignProjectsOpen(true);
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    ));
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  const confirmDeleteUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone,
              role: newUser.role,
              department: newUser.department,
              location: newUser.location,
              projects: newUser.projects,
              permissions: newUser.permissions
            }
          : user
      ));
      setIsEditUserOpen(false);
      setSelectedUser(null);
      resetNewUserForm();
    }
  };

  const handleUpdateUserProjects = () => {
    if (selectedUser) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, projects: newUser.projects }
          : user
      ));
      setIsAssignProjectsOpen(false);
      setSelectedUser(null);
      resetNewUserForm();
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      location: "",
      projects: [],
      permissions: ["read"]
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatLastActive = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newUser.location}
                      onChange={(e) => setNewUser(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="New York, NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Project Manager">Project Manager</SelectItem>
                        <SelectItem value="Senior Developer">Senior Developer</SelectItem>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                        <SelectItem value="Technical Writer">Technical Writer</SelectItem>
                        <SelectItem value="Security Analyst">Security Analyst</SelectItem>
                        <SelectItem value="Compliance Officer">Compliance Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={newUser.department} onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Documentation">Documentation</SelectItem>
                        <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                        <SelectItem value="IT Security">IT Security</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Project Assignments</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {mockProjects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`project-${project.id}`}
                          checked={newUser.projects.includes(project.name)}
                          onCheckedChange={() => handleProjectToggle(project.name)}
                        />
                        <Label htmlFor={`project-${project.id}`} className="text-sm">
                          {project.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="flex gap-4">
                    {["read", "write", "admin"].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permission-${permission}`}
                          checked={newUser.permissions.includes(permission)}
                          onCheckedChange={() => handlePermissionToggle(permission)}
                        />
                        <Label htmlFor={`permission-${permission}`} className="text-sm capitalize">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
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
              {departments.map((dept) => (
                <DropdownMenuItem key={dept} onClick={() => setDepartmentFilter(dept)}>
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {mockUsers.length} users
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <Badge variant={statusConfig[user.status as keyof typeof statusConfig].variant}>
                      {statusConfig[user.status as keyof typeof statusConfig].label}
                    </Badge>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Last active {formatLastActive(user.lastActive)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {user.permissions.includes("admin") && (
                        <span title="Admin">
                          <ShieldCheck className="h-4 w-4 text-red-500" />
                        </span>
                      )}
                      {user.permissions.includes("write") && (
                        <span title="Write Access">
                          <Edit className="h-4 w-4 text-blue-500" />
                        </span>
                      )}
                      <span title="Read Access">
                        <Eye className="h-4 w-4 text-green-500" />
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground mb-1">Projects ({user.projects.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {user.projects.map((project, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          {project}
                        </span>
                      ))}
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
                  <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAssignProjects(user)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Projects
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                    <UserMinus className="h-4 w-4 mr-2" />
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={() => handleDeleteUser(user)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
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
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.role}</p>
                  <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                    {selectedUser.status}
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
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Join Date</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Active</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.lastActive}</p>
                </div>
              </div>

              {selectedUser.projects && selectedUser.projects.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Assigned Projects</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedUser.projects.map((project: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      email: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({
                      ...selectedUser,
                      role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Project Manager">Project Manager</SelectItem>
                      <SelectItem value="Engineer">Engineer</SelectItem>
                      <SelectItem value="Designer">Designer</SelectItem>
                      <SelectItem value="Analyst">Analyst</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={selectedUser.department}
                    onValueChange={(value) => setSelectedUser({
                      ...selectedUser,
                      department: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedUser.phone}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      phone: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={selectedUser.location}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      location: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Projects Dialog */}
      <Dialog open={isAssignProjectsOpen} onOpenChange={setIsAssignProjectsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Projects</DialogTitle>
            <DialogDescription>
              Select projects to assign to {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {mockProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedUser?.projects?.includes(project.name) || false}
                      onCheckedChange={(checked) => {
                        if (selectedUser) {
                          const currentProjects = selectedUser.projects || [];
                          const newProjects = checked
                            ? [...currentProjects, project.name]
                            : currentProjects.filter((p: string) => p !== project.name);
                          setSelectedUser({
                            ...selectedUser,
                            projects: newProjects
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`project-${project.id}`} className="text-sm">
                      {project.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignProjectsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUserProjects}>
              Update Projects
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
              The user will be permanently removed from all projects and their access will be revoked.
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
