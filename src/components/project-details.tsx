"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Search,
  Filter,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Calendar,
  Users,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  ExternalLink,
  Share,
  History,
  UserCheck,
  ClipboardList,
  Send,
  Loader2,
  GitBranch,
  Globe,
  XCircle
} from "lucide-react";
import { DOCUMENT_STATUS_CONFIG, FILE_TYPE_CONFIG } from "@/constants/document.constants";
import { Project } from "@/types/project.types";
import { Document, DocumentStatus, DocumentUploadData } from "@/types/document.types";
import { AddDocumentModal } from "@/components/forms/add-document-modal";
import { EditDocumentModal, DocumentUpdateData } from "@/components/forms/edit-document-modal";
import { DocumentViewModal } from "@/components/forms/document-view-modal";
import { VersionHistoryModal } from "@/components/forms/version-history-modal";
import { DocumentLogsModal } from "@/components/forms/document-logs-modal";
import { SendForApprovalModal } from "@/components/forms/send-for-approval-modal";
import { UploadVersionModal } from "@/components/forms/upload-version-modal";
import { TeamMemberManagement } from "@/components/team-member-management";
import { ProjectSettings } from "@/components/project-settings";
import { ProjectChatBox } from "@/components/project-chat-box";
import { ChatToggleButton } from "@/components/chat-toggle-button";
import { useAuth } from "@/contexts/AuthContext";
import { documentLogging } from "@/utils/document-logging";

interface ProjectDetailsProps {
  projectId: string;
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<Document | null>(null);
  const [uploadingVersionDocument, setUploadingVersionDocument] = useState<Document | null>(null);
  const [logsDocument, setLogsDocument] = useState<Document | null>(null);
  const [sendingForApprovalDocument, setSendingForApprovalDocument] = useState<Document | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [chatUnreadCount, setChatUnreadCount] = useState(3); // Mock unread count
  
  // Data state
  const [project, setProject] = useState<Project | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<Document[]>([]);
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Project statistics
  const [projectStats, setProjectStats] = useState({
    totalDocuments: 0,
    pendingReview: 0,
    progress: 0,
    teamSize: {
      managers: 0,
      members: 0
    }
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Current user from auth context
  const currentUser = user ? {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email
  } : null;

  // Fetch project data function
  const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          if (projectResponse.status === 404) {
            setError('Project not found');
            return;
          }
          throw new Error('Failed to fetch project');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch project documents
        const documentsResponse = await fetch(`/api/documents?projectId=${projectId}`);
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setProjectDocuments(documentsData);
        } else {
          // If documents API fails, just set empty array (documents table might be empty)
          setProjectDocuments([]);
        }

        // Fetch team members count
        const teamResponse = await fetch(`/api/team?projectId=${projectId}`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeamMembersCount(teamData.length);
        } else {
          setTeamMembersCount(0);
        }
        
        // Fetch project statistics
        setStatsLoading(true);
        try {
          const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setProjectStats(statsData);
          }
        } catch (statsError) {
          console.error('Error fetching project statistics:', statsError);
          // Don't set main error - stats are supplementary information
        } finally {
          setStatsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
  };

  // Fetch project data on component mount
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const handleDownloadDocument = async (document: Document) => {
    if (document.sharePointPath) {
      // Log the download activity
      await documentLogging.logDownload(
        document.id, 
        document.version, 
        document.fileName, 
        document.fileSize
      );
      
      // Use the SharePoint path to download the document
      window.open(document.sharePointPath, '_blank');
    } else {
      // Fallback for documents without SharePoint path
      console.log("No SharePoint path available for document:", document.fileName);
      toast({
        variant: "destructive",
        title: "Download unavailable",
        description: "This document is not available for download.",
      });
    }
  };

  const handleOpenInSharePoint = async (document: Document) => {
    // Log the view activity
    await documentLogging.logView(document.id, document.version);
    
    if (document.sharePointPath) {
      // Use the actual SharePoint URL stored in the database
      window.open(document.sharePointPath, '_blank');
    } else {
      console.log("No SharePoint path available for document:", document.fileName);
      // Fallback: construct a generic SharePoint URL (this should ideally not happen)
      const fallbackUrl = `https://company.sharepoint.com/sites/documents/${document.fileName}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  const handleSendForApproval = async (approvers: any[], comments?: string) => {
    if (!sendingForApprovalDocument) return;
    
    try {
      // Call the API to create the approval workflow
      const response = await fetch(`/api/documents/${sendingForApprovalDocument.id}/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvers,
          comments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send document for approval');
      }

      const result = await response.json();
      console.log("Document sent for approval successfully:", result);
      
      // Update the document in local state with the latest data from the server
      if (result.document) {
        setProjectDocuments(prev => prev.map(doc => 
          doc.id === sendingForApprovalDocument.id
            ? { ...doc, ...result.document }
            : doc
        ));
      }
      
      // Refresh project statistics
      try {
        const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setProjectStats(statsData);
        }
      } catch (statsError) {
        console.error('Error refreshing project statistics:', statsError);
      }
      
      setSendingForApprovalDocument(null);
    } catch (error) {
      console.error("Failed to send document for approval:", error);
      throw error;
    }
  };

  const handleUploadVersion = async (data: {
    file: File;
    versionType: 'minor' | 'major';
    customVersion?: string;
    changesSummary: string;
  }) => {
    if (!uploadingVersionDocument) return;
    
    try {
      console.log('📤 Uploading new version for document:', uploadingVersionDocument.id);
      
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('documentId', uploadingVersionDocument.id);
      formData.append('versionType', data.versionType);
      formData.append('changesSummary', data.changesSummary);
      
      if (data.customVersion) {
        formData.append('customVersion', data.customVersion);
      }

      const response = await fetch('/api/documents/version', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload version');
      }

      const result = await response.json();
      const newVersion = result.version;
      
      // Log the version upload activity
      await documentLogging.logVersionUpload(
        uploadingVersionDocument.id,
        newVersion.version,
        data.file.name,
        data.file.size
      );
      
      // Update the document in local state with new version info
      setProjectDocuments(prev => prev.map(doc => 
        doc.id === uploadingVersionDocument.id 
          ? { ...doc, version: newVersion.version, lastModified: newVersion.uploadedAt }
          : doc
      ));
      
      // Refresh project statistics
      try {
        const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setProjectStats(statsData);
        }
      } catch (statsError) {
        console.error('Error refreshing project statistics:', statsError);
      }
      
      // Show success message
      toast({
        title: "New version uploaded successfully",
        description: `Version ${newVersion.version} of ${uploadingVersionDocument.name} has been uploaded to SharePoint.`,
      });
      
      setUploadingVersionDocument(null);
    } catch (error) {
      console.error("Failed to upload version:", error);
      
      // Show error message
      toast({
        variant: "destructive",
        title: "Version upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred while uploading the new version.",
      });
      
      throw error;
    }
  };

  // Filter documents based on search and status
  const filteredDocuments = useMemo(() => {
    return projectDocuments.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projectDocuments, searchTerm, statusFilter]);

  // Document statistics
  const documentStats = useMemo(() => {
    const stats = {
      total: projectDocuments.length
    };

    return stats;
  }, [projectDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for project header */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-sm" />
        </div>
        
        {/* Skeleton for statistics cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton for project info */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">{error || 'Project Not Found'}</h2>
        <p className="text-muted-foreground">
          {error || 'The requested project could not be found.'}
        </p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mt-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight capitalize">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button> */}
        </div>
      </div>

      {/* Project header actions */}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({projectStats.totalDocuments || documentStats.total})
          </TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Documents Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{projectStats.totalDocuments}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Documents in project
                </p>
              </CardContent>
            </Card>
            
            {/* Pending Review Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{projectStats.pendingReview}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Needs attention
                </p>
              </CardContent>
            </Card>
            
            {/* Progress Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{projectStats.progress}%</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${projectStats.progress}%` }}
                      />
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  Documents approved
                  {!statsLoading && projectStats.progress > 0 && 
                    <span className="block mt-1">{projectDocuments.filter(doc => doc.status === 'approved').length} of {projectStats.totalDocuments}</span>
                  }
                </p>
              </CardContent>
            </Card>
            
            {/* Team Size Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {project?.managers?.length || projectStats.teamSize.managers} <span className="text-sm font-normal text-muted-foreground">managers,</span> {teamMembersCount || projectStats.teamSize.members} <span className="text-sm font-normal text-muted-foreground">members</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Project Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <div className="mt-1">
                      <Badge variant={
                        project.priority === 'critical' ? 'destructive' :
                        project.priority === 'high' ? 'warning' : 'secondary'
                      }>
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Managers</label>
                    <div className="mt-1 space-y-2">
                      {project.managers.map((manager) => (
                        <div key={manager.id} className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="h-3 w-3" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{manager.name}</span>
                            {manager.isPrimaryManager && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                            {manager.canApproveDocuments && (
                              <Badge variant="outline" className="text-xs">Can Approve</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client</label>
                    <p className="mt-1">{project.client}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="mt-1">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="mt-1">{project.endDate ? formatDate(project.endDate) : 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Managers */}
                  {project.managers.map((manager) => (
                    <div key={manager.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{manager.name}</p>
                          {manager.isPrimaryManager && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Project Manager</p>
                      </div>
                      {manager.canApproveDocuments && (
                        <Badge variant="outline" className="text-xs">Can Approve</Badge>
                      )}
                    </div>
                  ))}
                  {/* Team Managers */}
                  {project.managers.map((manager, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {manager.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{manager.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {manager.isPrimaryManager ? 'Primary Manager' : 'Manager'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Document Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
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
                  {Object.entries(DOCUMENT_STATUS_CONFIG).map(([status, config]) => (
                    <DropdownMenuItem 
                      key={status} 
                      onClick={() => setStatusFilter(status as DocumentStatus)}
                    >
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* Document Status Summary */}
          {/* Status dashboard cards removed - no longer needed */}

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                All documents in this project ({filteredDocuments.length} of {projectStats.totalDocuments || documentStats.total})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Modified By</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton rows when loading
                    Array.from({length: 5}).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredDocuments.map((document) => {
                    const statusConfig = DOCUMENT_STATUS_CONFIG[document.status];
                    const fileConfig = FILE_TYPE_CONFIG[document.fileType as keyof typeof FILE_TYPE_CONFIG] || FILE_TYPE_CONFIG.default;
                    
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className={`text-lg ${fileConfig.color}`}>
                              {fileConfig.icon}
                            </span>
                            <div>
                              <p className="font-medium">{document.name}</p>
                              <p className="text-sm text-muted-foreground">{document.fileName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">
                            {document.fileType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{document.version}</TableCell>
                        <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                        <TableCell>{formatDate(document.lastModified)}</TableCell>
                        <TableCell>{document.lastModifiedBy}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingDocument(document)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingDocument(document)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setUploadingVersionDocument(document)}>
                                <GitBranch className="h-4 w-4 mr-2" />
                                Upload New Version
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setVersionHistoryDocument(document)}>
                                <History className="h-4 w-4 mr-2" />
                                Version History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLogsDocument(document)}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Activity Logs
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {document.status === 'pending_review' || document.status === 'under_review' ? (
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/documents/${document.id}/approvals/cancel`, {
                                      method: 'POST',
                                    });

                                    if (!response.ok) {
                                      const error = await response.json();
                                      throw new Error(error.error || 'Failed to cancel approval');
                                    }

                                    // Update document status in local state
                                    setProjectDocuments(prev => prev.map(doc => 
                                      doc.id === document.id
                                        ? { ...doc, status: 'draft' }
                                        : doc
                                    ));

                                    // Refresh project statistics
                                    try {
                                      const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
                                      if (statsResponse.ok) {
                                        const statsData = await statsResponse.json();
                                        setProjectStats(statsData);
                                      }
                                    } catch (statsError) {
                                      console.error('Error refreshing project statistics:', statsError);
                                    }

                                    toast({
                                      title: "Approval cancelled",
                                      description: "The approval workflow has been cancelled.",
                                    });
                                  } catch (error) {
                                    console.error('Failed to cancel approval:', error);
                                    toast({
                                      variant: "destructive",
                                      title: "Failed to cancel approval",
                                      description: error instanceof Error ? error.message : "An unexpected error occurred",
                                    });
                                  }
                                }}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Approval
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setSendingForApprovalDocument(document)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send for Approval
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleOpenInSharePoint(document)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in SharePoint
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this document?')) {
                                    try {
                                      const response = await fetch(`/api/projects/${projectId}/documents/${document.id}`, {
                                        method: 'DELETE',
                                      });
                                      
                                      if (response.ok) {
                                        // Remove from local state
                                        setProjectDocuments(prev => prev.filter(doc => doc.id !== document.id));
                                        
                                        toast({
                                          title: "Document deleted",
                                          description: "Document has been deleted successfully",
                                        });
                                        
                                        // Refresh project statistics after deletion
                                        try {
                                          const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
                                          if (statsResponse.ok) {
                                            const statsData = await statsResponse.json();
                                            setProjectStats(statsData);
                                          }
                                        } catch (statsError) {
                                          console.error('Error refreshing project statistics:', statsError);
                                        }
                                      } else {
                                        const errorData = await response.json();
                                        toast({
                                          variant: "destructive",
                                          title: "Error deleting document",
                                          description: errorData.message || "An error occurred while deleting the document",
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Error deleting document:', error);
                                      toast({
                                        variant: "destructive",
                                        title: "Error deleting document",
                                        description: "An error occurred while deleting the document",
                                      });
                                    }
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>

              {!isLoading && filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "Upload your first document to get started."}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Workflow</CardTitle>
              <CardDescription>
                Review and approval processes for project documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Workflow configuration and approval processes will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-4">
          <TeamMemberManagement
            project={project}
            onUpdateTeam={async (members, memberIds) => {
              console.log("Updating team:", members, memberIds);
              // Here you would call the API to update team members
            }}
            onUpdateManager={async (manager, managerId) => {
              console.log("Updating manager:", manager, managerId);
              // Here you would call the API to update project manager
            }}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <ProjectSettings
            project={project}
            onUpdateProject={async (updates) => {
              try {
                console.log("Updating project:", updates);
                
                const response = await fetch(`/api/projects/${projectId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(updates),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to update project');
                }

                const updatedProject = await response.json();
                setProject(updatedProject);
                
                toast({
                  title: "Project updated successfully",
                  description: "The project settings have been saved.",
                });
              } catch (error) {
                console.error("Failed to update project:", error);
                toast({
                  variant: "destructive",
                  title: "Update failed",
                  description: error instanceof Error ? error.message : "An unexpected error occurred while updating the project.",
                });
                throw error;
              }
            }}
            onArchiveProject={async () => {
              console.log("Archiving project:", project.id);
              // Here you would call the API to archive project
              router.push("/projects");
            }}
            onDeleteProject={async () => {
              console.log("Deleting project:", project.id);
              // Here you would call the API to delete project
              router.push("/projects");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Upload Document Modal */}
      <AddDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={async (data: DocumentUploadData) => {
          try {
            console.log("Uploading document:", data);
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('projectId', projectId);
            formData.append('description', data.description || '');
            formData.append('tags', JSON.stringify(data.tags || []));
            formData.append('customFieldValues', JSON.stringify(data.customFieldValues || {}));

            const response = await fetch('/api/documents/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to upload document');
            }

            const result = await response.json();
            const newDocument = result.document;
            
            // Log the document upload activity
            await documentLogging.logUpload(
              newDocument.id,
              newDocument.version,
              newDocument.fileName,
              newDocument.fileSize
            );
            
            // Add the new document to the local state
            setProjectDocuments(prev => [newDocument, ...prev]);
            
            // Refresh project statistics
            try {
              const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setProjectStats(statsData);
              }
            } catch (statsError) {
              console.error('Error refreshing project statistics:', statsError);
              // Don't show an error to the user for this
            }
            
            // Show success message
            const uploadCount = result.uploadResults?.length || 1;
            const errorCount = result.uploadErrors?.length || 0;
            
            if (errorCount > 0) {
              toast({
                title: "Document uploaded with some issues",
                description: `${data.file.name} uploaded to ${uploadCount} SharePoint location${uploadCount !== 1 ? 's' : ''}. ${errorCount} upload${errorCount !== 1 ? 's' : ''} failed.`,
                variant: "default",
              });
            } else {
              toast({
                title: "Document uploaded successfully",
                description: `${data.file.name} has been uploaded to all ${uploadCount} SharePoint location${uploadCount !== 1 ? 's' : ''} and saved to the project.`,
              });
            }
            
            // Return the upload results to the modal
            return result;
          } catch (error) {
            console.error("Failed to upload document:", error);
            
            // Show error message
            toast({
              variant: "destructive",
              title: "Upload failed",
              description: error instanceof Error ? error.message : "An unexpected error occurred while uploading the document.",
            });
            
            throw error;
          }
        }}
        project={project}
      />

      {/* Edit Document Modal */}
      {editingDocument && (
        <EditDocumentModal
          isOpen={editingDocument !== null}
          onClose={() => setEditingDocument(null)}
          onSubmit={async (data: DocumentUpdateData) => {
            console.log("Updating document:", editingDocument.id, data);
            
            try {
              const response = await fetch(`/api/documents/${editingDocument.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update document');
              }
              
              const updatedDocument = await response.json();
              
              // Update document in local state
              setProjectDocuments(prev => prev.map(doc => 
                doc.id === editingDocument.id
                  ? { ...doc, ...updatedDocument }
                  : doc
              ));
              
              // Refresh project statistics
              try {
                const statsResponse = await fetch(`/api/projects/${projectId}/statistics`);
                if (statsResponse.ok) {
                  const statsData = await statsResponse.json();
                  setProjectStats(statsData);
                }
              } catch (statsError) {
                console.error('Error refreshing project statistics:', statsError);
              }
              
              toast({
                title: "Document updated",
                description: "Document has been updated successfully",
              });
              
            } catch (error) {
              console.error('Error updating document:', error);
              toast({
                variant: "destructive",
                title: "Error updating document",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
              });
            }
            
            setEditingDocument(null);
          }}
          document={editingDocument}
          project={project}
        />
      )}

      {/* Document View Modal */}
      <DocumentViewModal
        isOpen={viewingDocument !== null}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
        onEdit={(document) => {
          setViewingDocument(null);
          setEditingDocument(document);
        }}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={versionHistoryDocument !== null}
        onClose={() => setVersionHistoryDocument(null)}
        document={versionHistoryDocument}
        onViewVersion={(version) => {
          console.log("Viewing version:", version, "of document:", versionHistoryDocument?.name);
          // Here you would implement version viewing functionality
        }}
      />

      {/* Upload Version Modal */}
      {uploadingVersionDocument && (
        <UploadVersionModal
          isOpen={uploadingVersionDocument !== null}
          onClose={() => setUploadingVersionDocument(null)}
          onSubmit={handleUploadVersion}
          document={uploadingVersionDocument}
        />
      )}

      {/* Document Logs Modal */}
      <DocumentLogsModal
        isOpen={logsDocument !== null}
        onClose={() => setLogsDocument(null)}
        document={logsDocument}
      />

      {/* Send for Approval Modal */}
      <SendForApprovalModal
        isOpen={sendingForApprovalDocument !== null}
        onClose={() => setSendingForApprovalDocument(null)}
        document={sendingForApprovalDocument}
        onSubmit={handleSendForApproval}
      />

      {/* Project Chat */}
      {currentUser && (
        <ProjectChatBox
          projectId={projectId}
          projectName={project?.name || "Project Chat"}
          currentUser={currentUser}
          isVisible={isChatVisible}
          onToggleVisibility={() => {
            setIsChatVisible(false);
            setChatUnreadCount(0); // Mark as read when closing
          }}
        />
      )}

      {/* Chat Toggle Button */}
      {/* {currentUser && (
        <ChatToggleButton
          isVisible={isChatVisible}
          unreadCount={chatUnreadCount}
          onToggle={() => {
            setIsChatVisible(true);
            setChatUnreadCount(0); // Mark as read when opening
          }}
          projectName={project?.name || "Project"}
        />
      )} */}
    </div>
  );
}
