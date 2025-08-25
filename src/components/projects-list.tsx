"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectForm } from "@/components/forms/project-form";
import { Project, ProjectFormData } from "@/types/project.types";
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
  ExternalLink,
  Loader2,
  ChevronRight
} from "lucide-react";

// API functions for projects
const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

const createProject = async (projectData: ProjectFormData): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
};

const updateProject = async (id: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...projectData }),
  });
  if (!response.ok) {
    throw new Error('Failed to update project');
  }
  return response.json();
};

const archiveProject = async (id: string): Promise<void> => {
  const response = await fetch(`/api/projects?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to archive project');
  }
};

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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  
  // Database state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      // Transform the data to match API expectations
      const apiData = {
        ...data,
        managerIds: data.managers.map(m => m.id),
        teamIds: [], // Add team support later if needed
        // Use the first SharePoint config if available
        ...(data.sharePointConfigs && data.sharePointConfigs[0] ? {
          sharePointSiteUrl: data.sharePointConfigs[0].siteUrl,
          sharePointDocumentLibrary: data.sharePointConfigs[0].documentLibrary,
          sharePointFolderPath: data.sharePointConfigs[0].folderPath || '',
          sharePointExcelPath: data.sharePointConfigs[0].excelPath || '',
          enableExcelLogging: data.sharePointConfigs[0].enableExcelLogging
        } : {})
      };
      
      await createProject(apiData);
      setIsCreateDialogOpen(false);
      await loadProjects(); // Refresh the list
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!editingProject) return;
    try {
      // Transform the data to match API expectations
      const apiData = {
        ...data,
        managerIds: data.managers.map(m => m.id),
        teamIds: [], // Add team support later if needed
        // Use the first SharePoint config if available
        ...(data.sharePointConfigs && data.sharePointConfigs[0] ? {
          sharePointSiteUrl: data.sharePointConfigs[0].siteUrl,
          sharePointDocumentLibrary: data.sharePointConfigs[0].documentLibrary,
          sharePointFolderPath: data.sharePointConfigs[0].folderPath || '',
          sharePointExcelPath: data.sharePointConfigs[0].excelPath || '',
          enableExcelLogging: data.sharePointConfigs[0].enableExcelLogging
        } : {})
      };
      
      await updateProject(editingProject, apiData);
      setEditingProject(null);
      await loadProjects(); // Refresh the list
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    }
  };

  const handleArchiveProject = async (id: string) => {
    try {
      await archiveProject(id);
      await loadProjects(); // Refresh the list
    } catch (err) {
      console.error('Error archiving project:', err);
      setError('Failed to archive project. Please try again.');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.managers.some(manager => manager.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 min-h-[400px] p-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <div className="space-y-2 mb-4">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-6" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <Button onClick={loadProjects} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your document control projects
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Export
          </Button> */}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="text-xs"
            size="sm"
          >
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
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="cursor-pointer rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold capitalize text-lg leading-tight mb-2">
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
                  <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => setEditingProject(project.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleArchiveProject(project.id)}
                  >
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

            {/* Project Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{project.managers.find(m => m.isPrimaryManager)?.name || project.managers[0]?.name}</span>
                {project.managers.length > 1 && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">+{project.managers.length - 1} more</span>
                )}
                {/* <span>•</span>
                <span>{project.team.length} members</span> */}
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{project.documentsCount} documents</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.startDate).toLocaleDateString()} - {project.endDate? new Date(project.endDate).toLocaleDateString() : "Ongoing"}</span>
              </div>
            </div>

            {/* Project Footer */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium ml-1">${project.budget}</span>
              </div>
              <span className="text-gray-400 text-sm flex items-center">
                Open Project
                <ChevronRight className="h-4 w-4 ml-2" />
              </span>
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
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      )}

      {/* Create Project Dialog */}
      <ProjectForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Edit Project Dialog */}
      {editingProject && (
        <ProjectForm
          isOpen={editingProject !== null}
          onClose={() => setEditingProject(null)}
          onSubmit={handleUpdateProject}
          project={projects.find(p => p.id === editingProject)}
        />
      )}
    </div>
  );
}
