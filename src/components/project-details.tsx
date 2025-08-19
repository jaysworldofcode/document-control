"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserCheck
} from "lucide-react";
import { MOCK_PROJECTS } from "@/constants/project.constants";
import { MOCK_DOCUMENTS, DOCUMENT_STATUS_CONFIG, FILE_TYPE_CONFIG } from "@/constants/document.constants";
import { Project } from "@/types/project.types";
import { Document, DocumentStatus, DocumentUploadData } from "@/types/document.types";
import { AddDocumentModal } from "@/components/forms/add-document-modal";
import { EditDocumentModal, DocumentUpdateData } from "@/components/forms/edit-document-modal";
import { TeamMemberManagement } from "@/components/team-member-management";
import { ProjectSettings } from "@/components/project-settings";

interface ProjectDetailsProps {
  projectId: string;
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // Find the project
  const project = useMemo(() => 
    MOCK_PROJECTS.find(p => p.id === projectId), 
    [projectId]
  );

  // Filter documents for this project
  const projectDocuments = useMemo(() => 
    MOCK_DOCUMENTS.filter(doc => doc.projectId === projectId),
    [projectId]
  );

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
      total: projectDocuments.length,
      draft: 0,
      pending_review: 0,
      under_review: 0,
      approved: 0,
      final: 0,
      checked_out: 0,
      rejected: 0,
      archived: 0
    };

    projectDocuments.forEach(doc => {
      stats[doc.status]++;
    });

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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Project Not Found</h2>
        <p className="text-muted-foreground">The requested project could not be found.</p>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Project Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {documentStats.approved + documentStats.final} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentStats.pending_review + documentStats.under_review}
            </div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.team.length}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documentStats.total})
          </TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                    <label className="text-sm font-medium text-muted-foreground">Manager</label>
                    <p className="mt-1">{project.manager}</p>
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
                    <p className="mt-1">{formatDate(project.endDate)}</p>
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
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{project.manager}</p>
                      <p className="text-sm text-muted-foreground">Project Manager</p>
                    </div>
                  </div>
                  {project.team.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member}</p>
                        <p className="text-sm text-muted-foreground">Team Member</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SharePoint Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>SharePoint Configuration</CardTitle>
              <CardDescription>
                Document storage and collaboration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Folder Path</label>
                  <p className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                    {project.sharePointConfig.folderPath}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Excel Logging</label>
                  <p className="mt-1">
                    {project.sharePointConfig.isExcelLoggingEnabled ? (
                      <span className="text-green-600">Enabled</span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )}
                  </p>
                </div>
                {project.sharePointConfig.excelSheetPath && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Excel Sheet Path</label>
                    <p className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                      {project.sharePointConfig.excelSheetPath}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
            {Object.entries(documentStats).filter(([key]) => key !== 'total').map(([status, count]) => (
              <Card key={status}>
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {status.replace('_', ' ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                All documents in this project ({filteredDocuments.length} of {documentStats.total})
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
                  {filteredDocuments.map((document) => {
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
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingDocument(document)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit & Upload Version
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="h-4 w-4 mr-2" />
                                Version History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in SharePoint
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredDocuments.length === 0 && (
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
              console.log("Updating project:", updates);
              // Here you would call the API to update project
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
          console.log("Uploading document:", data);
          // Here you would call the API to upload the document
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
            // Here you would call the API to update the document
            setEditingDocument(null);
          }}
          document={editingDocument}
          project={project}
        />
      )}
    </div>
  );
}
