"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AppLayout } from "@/components/layout/app-layout";
import { DocumentViewModal } from "@/components/forms/document-view-modal";
import { VersionHistoryModal } from "@/components/forms/version-history-modal";
import { DocumentLogsModal } from "@/components/forms/document-logs-modal";
import { SendForApprovalModal } from "@/components/forms/send-for-approval-modal";
import { MOCK_DOCUMENTS, DOCUMENT_STATUS_CONFIG } from "@/constants/document.constants";
import { MOCK_PROJECTS } from "@/constants/project.constants";
import { Document, DocumentStatus } from "@/types/document.types";
import { 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Eye,
  Download,
  History,
  MoreHorizontal,
  FileText,
  User,
  Calendar,
  Folder,
  Clock,
  ArrowUpDown,
  TrendingUp,
  BarChart3,
  FileCheck,
  AlertCircle,
  ClipboardList,
  ExternalLink,
  Send
} from "lucide-react";

type SortField = "name" | "uploadedAt" | "fileSize" | "status" | "project";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "table";

// Mock current user - in a real app this would come from authentication
const currentUser = "John Doe";

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, color: "text-gray-600" },
  pending: { label: "Pending", variant: "secondary" as const, color: "text-gray-600" },
  pending_review: { label: "Pending Review", variant: "secondary" as const, color: "text-blue-600" },
  under_review: { label: "Under Review", variant: "warning" as const, color: "text-yellow-600" },
  approved: { label: "Approved", variant: "success" as const, color: "text-green-600" },
  rejected: { label: "Rejected", variant: "destructive" as const, color: "text-red-600" },
  archived: { label: "Archived", variant: "outline" as const, color: "text-gray-500" },
  checked_out: { label: "Checked Out", variant: "info" as const, color: "text-blue-600" },
  final: { label: "Final", variant: "default" as const, color: "text-gray-900" },
};

export default function MyDocumentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("uploadedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<Document | null>(null);
  const [logsDocument, setLogsDocument] = useState<Document | null>(null);
  const [sendingForApprovalDocument, setSendingForApprovalDocument] = useState<Document | null>(null);

  // Filter documents for current user
  const userDocuments = useMemo(() => {
    return MOCK_DOCUMENTS.filter(doc => doc.uploadedBy === currentUser);
  }, []);

  // Apply search and filters
  const filteredDocuments = useMemo(() => {
    return userDocuments.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [userDocuments, searchTerm, statusFilter]);

  // Apply sorting
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "uploadedAt":
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
          break;
        case "fileSize":
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "project":
          aValue = getProjectName(a.projectId);
          bValue = getProjectName(b.projectId);
          break;
        default:
          aValue = a.uploadedAt;
          bValue = b.uploadedAt;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredDocuments, sortField, sortDirection]);

  // Document statistics
  const documentStats = useMemo(() => {
    const stats = {
      total: userDocuments.length,
      byStatus: {} as Record<string, number>,
      totalSize: 0,
      recentUploads: 0,
    };

    userDocuments.forEach(doc => {
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
      stats.totalSize += doc.fileSize;
      
      // Count uploads in last 7 days
      const uploadDate = new Date(doc.uploadedAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (uploadDate > sevenDaysAgo) {
        stats.recentUploads++;
      }
    });

    return stats;
  }, [userDocuments]);

  const getProjectName = (projectId: string) => {
    const project = MOCK_PROJECTS.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDownloadDocument = (document: Document) => {
    console.log("Downloading document:", document.fileName);
    const link = window.document.createElement('a');
    link.href = '#';
    link.download = document.fileName;
    link.click();
  };

  const handleOpenInSharePoint = (document: Document) => {
    // In a real app, this would construct the actual SharePoint URL
    console.log("Opening in SharePoint:", document.fileName);
    const sharePointUrl = `https://company.sharepoint.com/sites/documents/${document.fileName}`;
    window.open(sharePointUrl, '_blank');
  };

  const handleSendForApproval = async (approvers: any[], comments?: string) => {
    if (!sendingForApprovalDocument) return;
    
    try {
      // In a real app, this would call an API to create the approval workflow
      console.log("Sending document for approval:", {
        document: sendingForApprovalDocument,
        approvers,
        comments
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update document status to "pending_review" 
      // In real app, this would update the actual document record
      console.log("Document sent for approval successfully");
      
      setSendingForApprovalDocument(null);
    } catch (error) {
      console.error("Failed to send document for approval:", error);
      throw error;
    }
  };

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      variant: "secondary" as const,
      color: "text-gray-600"
    };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
            <p className="text-muted-foreground">
              View and manage all your uploaded documents across all projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.total}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.recentUploads}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.byStatus.approved || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(documentStats.byStatus.pending_review || 0) + (documentStats.byStatus.under_review || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
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
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {statusFilter === "all" ? "All" : getStatusConfig(statusFilter).label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Statuses
                </DropdownMenuItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <DropdownMenuItem 
                    key={status} 
                    onClick={() => setStatusFilter(status as DocumentStatus)}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${config.color}`} />
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {sortedDocuments.length} of {userDocuments.length} documents
          </div>
          <div className="text-sm text-muted-foreground">
            Total size: {formatFileSize(documentStats.totalSize)}
          </div>
        </div>

        {/* Documents Table */}
        {viewMode === "table" ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Document Name
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("project")}
                    >
                      <div className="flex items-center gap-2">
                        Project
                        {getSortIcon("project")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("fileSize")}
                    >
                      <div className="flex items-center gap-2">
                        Size
                        {getSortIcon("fileSize")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("uploadedAt")}
                    >
                      <div className="flex items-center gap-2">
                        Uploaded
                        {getSortIcon("uploadedAt")}
                      </div>
                    </TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDocuments.map((document) => {
                    const statusConfig = getStatusConfig(document.status);
                    
                    return (
                      <TableRow key={document.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{document.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {document.fileName}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getProjectName(document.projectId)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatFileSize(document.fileSize)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(document.uploadedAt).toLocaleDateString()}
                          </span>
                        </TableCell>
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
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
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
                              <DropdownMenuItem onClick={() => setSendingForApprovalDocument(document)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send for Approval
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenInSharePoint(document)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in SharePoint
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/projects/${document.projectId}`)}>
                                <Folder className="h-4 w-4 mr-2" />
                                Go to Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedDocuments.map((document) => {
              const statusConfig = getStatusConfig(document.status);
              
              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingDocument(document)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
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
                          <DropdownMenuItem onClick={() => setSendingForApprovalDocument(document)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send for Approval
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenInSharePoint(document)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in SharePoint
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold truncate" title={document.name}>
                        {document.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {document.fileName}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getFileExtension(document.fileName)}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          <span className="truncate">{getProjectName(document.projectId)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{formatFileSize(document.fileSize)}</span>
                          {document.version && (
                            <span>v{document.version}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {sortedDocuments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't uploaded any documents yet."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => router.push("/projects")}>
                  Go to Projects
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document View Modal */}
        <DocumentViewModal
          isOpen={viewingDocument !== null}
          onClose={() => setViewingDocument(null)}
          document={viewingDocument}
        />

        {/* Version History Modal */}
        <VersionHistoryModal
          isOpen={versionHistoryDocument !== null}
          onClose={() => setVersionHistoryDocument(null)}
          document={versionHistoryDocument}
        />

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
      </div>
    </AppLayout>
  );
}
