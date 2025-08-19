"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Users,
  FileText,
  Eye,
  Edit,
  Archive,
  Trash2,
  ExternalLink
} from "lucide-react";

// Mock data for projects
const mockProjects = [
  {
    id: 1,
    name: "Document Management System v2.0",
    description: "Comprehensive upgrade of the current document management platform with enhanced security and user experience.",
    status: "active",
    priority: "high",
    manager: "Sarah Wilson",
    team: ["John Doe", "Jane Smith", "Mike Johnson"],
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    progress: 75,
    documentsCount: 142,
    budget: "$125,000",
    client: "TechCorp Industries"
  },
  {
    id: 2,
    name: "API Documentation Portal",
    description: "Creation of a comprehensive API documentation portal for external developers and partners.",
    status: "planning",
    priority: "medium",
    manager: "David Chen",
    team: ["Alice Brown", "Bob Wilson"],
    startDate: "2024-03-01",
    endDate: "2024-05-15",
    progress: 25,
    documentsCount: 23,
    budget: "$45,000",
    client: "DevPartners LLC"
  },
  {
    id: 3,
    name: "Compliance Audit System",
    description: "Implementation of automated compliance checking and audit trail system for document workflows.",
    status: "completed",
    priority: "high",
    manager: "Emily Rodriguez",
    team: ["Tom Anderson", "Lisa Garcia", "Mark Thompson", "Anna Davis"],
    startDate: "2023-10-01",
    endDate: "2024-01-31",
    progress: 100,
    documentsCount: 89,
    budget: "$85,000",
    client: "FinanceSecure Corp"
  },
  {
    id: 4,
    name: "Mobile App Integration",
    description: "Development of mobile application for document access and basic editing capabilities.",
    status: "on-hold",
    priority: "low",
    manager: "Chris Taylor",
    team: ["Sam Wilson", "Amy Johnson"],
    startDate: "2024-02-15",
    endDate: "2024-08-30",
    progress: 15,
    documentsCount: 12,
    budget: "$95,000",
    client: "MobileTech Solutions"
  },
  {
    id: 5,
    name: "Security Enhancement Project",
    description: "Comprehensive security audit and implementation of advanced security measures across all systems.",
    status: "active",
    priority: "critical",
    manager: "Alex Kumar",
    team: ["Ryan Lee", "Sophie Chen", "Michael Brown"],
    startDate: "2024-01-01",
    endDate: "2024-04-30",
    progress: 60,
    documentsCount: 67,
    budget: "$150,000",
    client: "SecureData Inc"
  }
];

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  planning: { label: "Planning", variant: "info" as const },
  completed: { label: "Completed", variant: "default" as const },
  "on-hold": { label: "On Hold", variant: "warning" as const },
};

const priorityConfig = {
  low: { label: "Low", variant: "secondary" as const },
  medium: { label: "Medium", variant: "info" as const },
  high: { label: "High", variant: "warning" as const },
  critical: { label: "Critical", variant: "destructive" as const },
};

export function ProjectsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.manager.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your document control projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
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
              <DropdownMenuItem onClick={() => setStatusFilter("planning")}>
                Planning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("on-hold")}>
                On Hold
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("critical")}>
                Critical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {mockProjects.length} projects
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight mb-2">
                  {project.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={statusConfig[project.status as keyof typeof statusConfig].variant}>
                    {statusConfig[project.status as keyof typeof statusConfig].label}
                  </Badge>
                  <Badge variant={priorityConfig[project.priority as keyof typeof priorityConfig].variant}>
                    {priorityConfig[project.priority as keyof typeof priorityConfig].label}
                  </Badge>
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
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Project Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>

            {/* Project Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{project.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{project.manager}</span>
                <span>•</span>
                <span>{project.team.length} members</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{project.documentsCount} documents</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Project Footer */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium ml-1">{project.budget}</span>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first project."}
          </p>
          {!searchTerm && statusFilter === "all" && priorityFilter === "all" && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
