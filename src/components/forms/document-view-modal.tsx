"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Document } from "@/types/document.types";
import { 
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  Hash,
  Clock,
  Edit,
  Tag,
  Building,
  Globe,
  ExternalLink
} from "lucide-react";

interface DocumentViewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: Document) => void;
}

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

export function DocumentViewModal({ 
  document, 
  isOpen, 
  onClose,
  onEdit 
}: DocumentViewModalProps) {
  if (!document) return null;

  // Get status configuration with fallback
  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      variant: "secondary" as const,
      color: "text-gray-600"
    };
  };

  const currentStatusConfig = getStatusConfig(document.status);

  const handleDownload = () => {
    // In a real app, this would download the actual file
    console.log("Downloading document:", document.fileName);
    // Create a temporary link to simulate download
    const link = window.document.createElement('a');
    link.href = '#';
    link.download = document.fileName;
    link.click();
  };

  const handleOpenInSharePoint = () => {
    // In a real app, this would construct the actual SharePoint URL
    console.log("Opening in SharePoint:", document.fileName);
    const sharePointUrl = `https://company.sharepoint.com/sites/documents/${document.fileName}`;
    window.open(sharePointUrl, '_blank');
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Details
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
          <div className="space-y-6">
            {/* Document Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{document.name}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <Badge 
                    variant={currentStatusConfig.variant}
                    className="flex items-center gap-1"
                  >
                    <div className={`w-2 h-2 rounded-full ${currentStatusConfig.color}`} />
                    {currentStatusConfig.label}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {getFileExtension(document.fileName)}
                  </Badge>
                  {document.version && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      v{document.version}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleOpenInSharePoint}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in SharePoint
                </Button>
                {onEdit && (
                  <Button onClick={() => onEdit(document)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Document Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">Created by</span>
                      <p className="font-medium">{document.uploadedBy}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">Created on</span>
                      <p className="font-medium">
                        {new Date(document.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">Last modified</span>
                      <p className="font-medium">
                        {new Date(document.lastModified).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {document.fileSize && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">File size</span>
                        <p className="font-medium">{formatFileSize(document.fileSize)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document Properties */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">Status</span>
                      <p className="font-medium">{currentStatusConfig.label}</p>
                    </div>
                  </div>

                  {document.version && (
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">Version</span>
                        <p className="font-medium">v{document.version}</p>
                      </div>
                    </div>
                  )}

                  {document.tags && document.tags.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">File type</span>
                      <p className="font-medium">{getFileExtension(document.fileName)} Document</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {document.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {document.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Document Preview Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Document Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Preview not available for {getFileExtension(document.fileName)} files
                    </p>
                    <Button variant="link" className="text-sm" onClick={handleDownload}>
                      Download to view
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version Summary */}
            {document.version && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Version Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Current Version: v{document.version}</span>
                      <Badge variant="outline">Latest</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last updated on {new Date(document.lastModified).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} by {document.lastModifiedBy}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
