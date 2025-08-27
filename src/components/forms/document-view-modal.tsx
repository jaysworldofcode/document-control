"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  Edit, 
  Calendar, 
  User, 
  Tag, 
  FileIcon,
  ExternalLink,
  MessageCircle,
  Loader2,
  XCircle
} from "lucide-react";
import { Document } from "@/types/document.types";
import { DocumentApprovalTimeline } from "@/components/document-approval-timeline";
import { useState, useEffect } from "react";
import { DocumentComment, NewCommentData, CommentReaction } from "@/types/comment.types";
import { DocumentComments } from "@/components/document-comments";
import { DOCUMENT_STATUS_CONFIG, FILE_TYPE_CONFIG } from "@/constants/document.constants";
import { Project, CustomField } from "@/types/project.types";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onEdit?: (document: Document) => void;
}

interface ApprovalWorkflow {
  id: string;
  document_id: string;
  current_step: number;
  total_steps: number;
  overall_status: 'pending' | 'under-review' | 'approved' | 'rejected';
  document_approval_steps: Array<{
    id: string;
    approver: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    step_order: number;
    comments?: string;
    approved_at?: string;
    rejected_at?: string;
    viewed_document: boolean;
    attachments?: Array<{
      id: string;
      file_name: string;
      file_size: number;
      file_type: string;
      download_url?: string;
    }>;
  }>;
}

export function DocumentViewModal({ 
  isOpen, 
  onClose, 
  document,
  onEdit 
}: DocumentViewModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  const currentUser = user ? {
    id: user.id,
    name: `${user.firstName} ${user.lastName}` || user.email
  } : null;

  // Load comments, workflow and project data when document changes
  useEffect(() => {
    const loadData = async () => {
      if (!document?.id) return;
      
      setLoadingComments(true);
      setLoadingWorkflow(true);
      setLoadingProject(true);
      
      try {
        // Load comments
        const commentsResponse = await fetch(`/api/comments?documentId=${document.id}`);
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(commentsData || []);
        }

        // Load workflow
        const workflowResponse = await fetch(`/api/documents/${document.id}/approvals`);
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          const workflow = workflowData.workflow;

          // Load attachments for rejected steps
          if (workflow) {
            const rejectedStep = workflow.document_approval_steps.find((step: {status: string}) => step.status === 'rejected');
            if (rejectedStep) {
              const attachmentsResponse = await fetch(`/api/documents/${document.id}/approvals/${rejectedStep.id}/attachments`);
              if (attachmentsResponse.ok) {
                const attachments = await attachmentsResponse.json();
                rejectedStep.attachments = attachments;
              }
            }
          }
          
          setWorkflow(workflow);
        } else if (workflowResponse.status !== 404) {
          console.error('Failed to load workflow:', await workflowResponse.text());
        }

        // Load project data to get field names
        if (document.projectId) {
          const projectResponse = await fetch(`/api/projects/${document.projectId}`);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            setProject(projectData);
          } else {
            console.error('Failed to load project data:', await projectResponse.text());
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingComments(false);
        setLoadingWorkflow(false);
        setLoadingProject(false);
      }
    };

    if (isOpen && document) {
      loadData();
    }
  }, [isOpen, document]);

  const handleAddComment = async (data: NewCommentData) => {
    if (!document?.id || !currentUser) return;

    try {
      const formData = new FormData();
      formData.append('documentId', document.id);
      formData.append('content', data.content);
      
      if (data.replyTo) {
        formData.append('replyTo', data.replyTo);
      }
      
      if (data.attachments) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setComments(prev => [result.comment, ...prev]);
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commentId,
          content
        })
      });

      if (response.ok) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, content, isEdited: true, updatedAt: new Date().toISOString() }
              : comment
          )
        );
      } else {
        throw new Error('Failed to update comment');
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId })
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  };

  const handleReactToComment = async (commentId: string, reactionType: CommentReaction['type']) => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/comments/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commentId,
          reactionType
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        setComments(prev => 
          prev.map(comment => {
            if (comment.id === commentId) {
              const existingReactions = comment.reactions || [];
              const userReactionIndex = existingReactions.findIndex(
                r => r.userId === currentUser.id && r.type === reactionType
              );

              let newReactions;
              if (userReactionIndex >= 0) {
                // Remove existing reaction
                newReactions = existingReactions.filter((_, index) => index !== userReactionIndex);
              } else {
                // Add new reaction
                newReactions = [...existingReactions, {
                  id: `temp-${Date.now()}`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  type: reactionType,
                  createdAt: new Date().toISOString()
                }];
              }

              return { ...comment, reactions: newReactions };
            }
            return comment;
          })
        );
      } else {
        throw new Error('Failed to react to comment');
      }
    } catch (error) {
      console.error('Failed to react to comment:', error);
      throw error;
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    
    try {
      // Create a download link for the SharePoint file
      window.open(document.sharePointPath, '_blank');
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleOpenInSharePoint = () => {
    if (!document) return;
    window.open(document.sharePointPath, '_blank');
  };

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!document) return null;

  // Add fallback for unknown status
  const statusConfig = DOCUMENT_STATUS_CONFIG[document.status] || {
    label: document.status || 'Unknown',
    variant: 'secondary',
    color: 'gray'
  };
  
  // Handle file type config with proper type checking
  const fileExt = typeof document.fileType === 'string' ? document.fileType.toLowerCase() : '';
  const fileTypeConfig = (fileExt && FILE_TYPE_CONFIG[fileExt as keyof typeof FILE_TYPE_CONFIG]) 
    ? FILE_TYPE_CONFIG[fileExt as keyof typeof FILE_TYPE_CONFIG] 
    : FILE_TYPE_CONFIG.default;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between mt-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <FileIcon className="h-5 w-5" style={{ color: fileTypeConfig.color }} />
                {document.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={statusConfig.variant}
                  className="text-xs"
                >
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  v{document.version}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {document.fileType.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(document.fileSize)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenInSharePoint}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in SharePoint
              </Button>
              {onEdit && (
                <Button
                  size="sm"
                  onClick={() => onEdit(document)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Document Details</TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 overflow-auto">
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {/* Rejection Details */}
                {document.status === 'rejected' && workflow?.document_approval_steps && (() => {
                  const rejectedStep = workflow.document_approval_steps.find((step: {status: string}) => step.status === 'rejected');
                  if (!rejectedStep) return null;

                  return (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                          <XCircle className="h-5 w-5" />
                          Document Rejected
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {rejectedStep.comments && (
                          <div>
                            <label className="text-sm font-medium text-red-700">Rejection Reason</label>
                            <p className="mt-1 text-sm text-red-600 bg-white rounded-md p-3 border border-red-200">
                              {rejectedStep.comments}
                            </p>
                          </div>
                        )}
                        {/* Rejection Attachments */}
                        {rejectedStep.attachments && rejectedStep.attachments.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-red-700">Attachments</label>
                            <div className="mt-2 space-y-2">
                              {rejectedStep.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between bg-white rounded-md p-2 border border-red-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileIcon className="h-4 w-4 text-red-600" />
                                    <span className="text-sm text-red-600">{attachment.file_name}</span>
                                    <span className="text-xs text-red-500">
                                      ({formatFileSize(attachment.file_size)})
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      if (attachment.download_url) {
                                        window.open(attachment.download_url, '_blank');
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-red-700">Rejected By</label>
                            <p className="text-sm text-red-600">
                              {rejectedStep.approver.first_name} {rejectedStep.approver.last_name}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-red-700">Rejected At</label>
                            <p className="text-sm text-red-600">
                              {rejectedStep.rejected_at && formatDate(rejectedStep.rejected_at)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Document Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">File Name</label>
                        <p className="text-sm">{document.fileName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">File Type</label>
                        <p className="text-sm">{document.fileType.toUpperCase()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">File Size</label>
                        <p className="text-sm">{formatFileSize(document.fileSize)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Version</label>
                        <p className="text-sm">v{document.version}</p>
                      </div>
                    </div>

                    {document.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm whitespace-pre-wrap">{document.description}</p>
                      </div>
                    )}

                    {document.tags && document.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upload & Modification Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload & Modification History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Uploaded By</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{document.uploadedBy}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(document.uploadedAt)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Modified By</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{document.lastModifiedBy}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(document.lastModified)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Timeline */}
                {(document.status === 'pending_review' || document.status === 'under_review' || document.status === 'approved' || document.status === 'rejected') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Approval Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingWorkflow ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading approval status...</span>
                        </div>
                      ) : workflow ? (
                        <DocumentApprovalTimeline workflow={workflow} />
                      ) : (
                        <p className="text-sm text-muted-foreground">No approval workflow found.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Custom Fields */}
                {document.customFieldValues && Object.keys(document.customFieldValues).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Data Fields</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingProject ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading field data...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(document.customFieldValues || {}).map(([fieldKey, value]) => {
                            // Find the field definition from project custom fields
                            // First try to find by ID, then by name (for backwards compatibility)
                            let fieldDef = project?.customFields?.find((field: CustomField) => field.id === fieldKey);
                            if (!fieldDef) {
                              fieldDef = project?.customFields?.find((field: CustomField) => field.name === fieldKey);
                            }
                            
                            // Debug logging
                            console.log('Field Key:', fieldKey);
                            console.log('Project custom fields:', project?.customFields);
                            console.log('Found field def:', fieldDef);
                            console.log('Field def label:', fieldDef?.label);
                            console.log('Field def name:', fieldDef?.name);
                            
                            // Determine display label - prioritize label, then name, then fieldKey
                            const displayLabel = fieldDef?.label && fieldDef.label.trim() !== '' 
                              ? fieldDef.label 
                              : fieldDef?.name || fieldKey;
                            
                            console.log('Using display label:', displayLabel);
                            
                            return (
                              <div key={fieldKey} className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                  {displayLabel}
                                  {fieldDef?.required && <span className="text-destructive ml-1">*</span>}
                                </label>
                                <p className="text-sm">{String(value || '')}</p>
                                {fieldDef?.helpText && (
                                  <p className="text-xs text-muted-foreground">{fieldDef.helpText}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Checkout Information */}
                {document.checkoutInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Checkout Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Checked Out By</label>
                        <p className="text-sm">{document.checkoutInfo.checkedOutBy}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Checked Out At</label>
                        <p className="text-sm">{formatDate(document.checkoutInfo.checkedOutAt)}</p>
                      </div>
                      {document.checkoutInfo.reason && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Reason</label>
                          <p className="text-sm">{document.checkoutInfo.reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="mt-4 overflow-hidden">
            <ScrollArea className="h-[500px]">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading comments...</span>
                </div>
              ) : currentUser ? (
                <DocumentComments
                  documentId={document.id}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onReactToComment={handleReactToComment}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                />
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">Please sign in</h3>
                  <p className="text-muted-foreground">You need to be signed in to view and add comments.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
