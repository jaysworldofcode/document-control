"use client";

import React, { useState, useMemo } from "react";
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
import { RejectDocumentModal } from "@/components/forms/reject-document-modal";
import { ApproveDocumentModal } from "@/components/forms/approve-document-modal";
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
  const [rejectingDocument, setRejectingDocument] = useState<Document | null>(null);

  // State for documents from API
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents pending approval for current user
  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/approvals');
      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      console.error('Error fetching pending approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents on component mount
  React.useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Apply search and status filters
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchTerm, statusFilter]);

  // Get project name for a document (now included in API response)
  const getProjectName = (document: any) => {
    return document.projectName || "Unknown Project";
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

  const [approvingDocument, setApprovingDocument] = useState<Document | null>(null);

  const handleApproveDocument = (document: Document) => {
    setApprovingDocument(document);
  };

  const handleSubmitApproval = async (comments?: string) => {
    if (!approvingDocument) return;
    
    try {
      const response = await fetch(`/api/documents/${approvingDocument.id}/approvals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          comments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve document');
      }

      const result = await response.json();
      console.log("Document approved successfully:", result);
      
      // Refresh the documents list
      fetchPendingApprovals();
    } catch (error) {
      console.error("Failed to approve document:", error);
      // Could show toast notification here
    }
  };

  const handleRejectDocument = (document: Document) => {
    setRejectingDocument(document);
  };

  const handleSubmitRejection = async (comments: string, files?: File[]) => {
    if (!rejectingDocument) return;
    
    try {
      // First, reject the document with comments
      const rejectResponse = await fetch(`/api/documents/${rejectingDocument.id}/approvals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          comments
        })
      });

      if (!rejectResponse.ok) {
        const errorData = await rejectResponse.json();
        throw new Error(errorData.error || 'Failed to reject document');
      }

      // If there are files, upload them
      if (files && files.length > 0) {
        // Get the workflow to find the step ID
        const workflowResponse = await fetch(`/api/documents/${rejectingDocument.id}/approvals`);
        const workflowData = await workflowResponse.json();
        const workflow = workflowData.workflow;

        if (workflow) {
          const userStep = workflow.document_approval_steps.find(
            (step: any) => step.approver_id === workflow.current_step
          );

          if (userStep) {
            const formData = new FormData();
            files.forEach(file => {
              formData.append('files', file);
            });

            const attachmentResponse = await fetch(
              `/api/documents/${rejectingDocument.id}/approvals/${userStep.id}/attachments`,
              {
                method: 'POST',
                body: formData
              }
            );

            if (!attachmentResponse.ok) {
              console.error('Failed to upload attachments:', await attachmentResponse.text());
            }
          }
        }
      }

      // Refresh the documents list
      fetchPendingApprovals();
      
      setRejectingDocument(null);
    } catch (error) {
      console.error("Failed to reject document:", error);
      throw error;
    }
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Document Approvals</h1>
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
            Showing {filteredDocuments.length} of {documents.length} documents pending your approval
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="text-muted-foreground">Loading pending approvals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={fetchPendingApprovals}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredDocuments.length > 0 ? (
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
                                  <span>{getProjectName(document)}</span>
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
                            {/* <DropdownMenuItem onClick={() => setSendingForApprovalDocument(document)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send for Approval
                            </DropdownMenuItem> */}
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

        {/* Reject Document Modal */}
        <RejectDocumentModal
          isOpen={rejectingDocument !== null}
          onClose={() => setRejectingDocument(null)}
          documentName={rejectingDocument?.name || ''}
          onReject={handleSubmitRejection}
        />

        {/* Approve Document Modal */}
        <ApproveDocumentModal
          isOpen={approvingDocument !== null}
          onClose={() => setApprovingDocument(null)}
          documentName={approvingDocument?.name || ''}
          onApprove={handleSubmitApproval}
        />
      </div>
    </AppLayout>
  );
}
