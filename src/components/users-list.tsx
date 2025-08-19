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
  { id: 1, name: "Document Management System v2.0" },
  { id: 2, name: "API Documentation Portal" },
  { id: 3, name: "Compliance Audit System" },
  { id: 4, name: "Security Enhancement Project" },
  { id: 5, name: "Mobile App Integration" }
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

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(mockUsers.map(user => user.department)));

  const handleAddUser = () => {
    // Here you would typically send the data to your API
    console.log("Adding user:", newUser);
    setIsAddUserOpen(false);
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
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Projects
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserMinus className="h-4 w-4 mr-2" />
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}
