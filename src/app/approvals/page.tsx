"use client";

import { useState, useMemo } from "react";
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
import { AppLayout } from "@/components/layout/app-layout";
import { DocumentViewModal } from "@/components/forms/document-view-modal";
import { VersionHistoryModal } from "@/components/forms/version-history-modal";
import { DocumentLogsModal } from "@/components/forms/document-logs-modal";
import { SendForApprovalModal } from "@/components/forms/send-for-approval-modal";
import { MOCK_DOCUMENTS, DOCUMENT_STATUS_CONFIG } from "@/constants/document.constants";
import { MOCK_PROJECTS } from "@/constants/project.constants";
import { Document } from "@/types/document.types";
import { 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  Eye,
  Download,
  History,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  Folder,
  ClipboardList,
  ExternalLink,
  Send
} from "lucide-react";

const reviewStatusConfig = {
  under_review: { 
    label: "Under Review", 
    variant: "warning" as const, 
    icon: Clock,
    color: "text-amber-600"
  },
  pending_review: { 
    label: "Pending Review", 
    variant: "secondary" as const, 
    icon: AlertCircle,
    color: "text-gray-600"
  },
};

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "under_review" | "pending_review">("all");
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<Document | null>(null);
  const [logsDocument, setLogsDocument] = useState<Document | null>(null);
  const [sendingForApprovalDocument, setSendingForApprovalDocument] = useState<Document | null>(null);

  // Filter documents that need review
  const reviewDocuments = useMemo(() => {
    return MOCK_DOCUMENTS.filter(doc => 
      doc.status === "under_review" || doc.status === "pending_review"
    );
  }, []);

  // Apply search and status filters
  const filteredDocuments = useMemo(() => {
    return reviewDocuments.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [reviewDocuments, searchTerm, statusFilter]);

  // Get project name for a document
  const getProjectName = (projectId: string) => {
    const project = MOCK_PROJECTS.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
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

  const handleApproveDocument = (document: Document) => {
    console.log("Approving document:", document.name);
    // In a real app, this would call an API to approve the document
  };

  const handleRejectDocument = (document: Document) => {
    console.log("Rejecting document:", document.name);
    // In a real app, this would call an API to reject the document
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve documents awaiting your attention
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {filteredDocuments.length} Documents Pending
            </Badge>
          </div>
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
                  Status: {statusFilter === "all" ? "All" : reviewStatusConfig[statusFilter as keyof typeof reviewStatusConfig]?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending_review")}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("under_review")}>
                  <Clock className="h-4 w-4 mr-2" />
                  Under Review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredDocuments.length} of {reviewDocuments.length} documents needing review
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length > 0 ? (
          <div className="space-y-4">
            {filteredDocuments.map((document) => {
              const statusConfig = reviewStatusConfig[document.status as keyof typeof reviewStatusConfig];
              const StatusIcon = statusConfig?.icon || AlertCircle;
              
              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Document Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                          </div>

                          {/* Document Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold truncate">{document.name}</h3>
                              <Badge 
                                variant={statusConfig?.variant || "secondary"}
                                className="flex items-center gap-1 shrink-0"
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig?.label || document.status}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{document.uploadedBy}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Folder className="h-3 w-3" />
                                  <span>{getProjectName(document.projectId)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{document.fileName}</span>
                                <span>•</span>
                                <span>{getFileExtension(document.fileName)}</span>
                                <span>•</span>
                                <span>{formatFileSize(document.fileSize)}</span>
                                {document.version && (
                                  <>
                                    <span>•</span>
                                    <span>v{document.version}</span>
                                  </>
                                )}
                              </div>

                              {/* Tags */}
                              {document.tags && document.tags.length > 0 && (
                                <div className="flex items-center gap-2">
                                  {document.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {document.tags.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{document.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {/* Quick Actions */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveDocument(document)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectDocument(document)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>

                        {/* More Actions Menu */}
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No documents need review</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "All documents are up to date and approved."}
              </p>
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
