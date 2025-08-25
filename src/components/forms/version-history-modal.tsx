"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Document, DocumentRevision } from "@/types/document.types";
import { 
  Calendar,
  User,
  FileText,
  Download,
  Hash,
  Clock,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle,
  ArrowRight,
  FileDown,
  History,
  Loader2,
  AlertCircle
} from "lucide-react";

interface VersionHistoryModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onViewVersion?: (version: string) => void;
}

interface VersionData {
  id: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  changes: string;
  filePath: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
  isCurrent: boolean;
  description?: string;
}

export function VersionHistoryModal({ 
  document, 
  isOpen, 
  onClose,
  onViewVersion 
}: VersionHistoryModalProps) {
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch version history when modal opens
  useEffect(() => {
    if (isOpen && document) {
      fetchVersionHistory();
    }
  }, [isOpen, document]);

  const fetchVersionHistory = async () => {
    if (!document) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents/${document.id}/versions`);
      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }
      
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error('Error fetching version history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load version history');
      
      // Fallback: create a basic version list with current document
      const fallbackVersion: VersionData = {
        id: `current-${document.version}`,
        version: document.version,
        uploadedBy: document.lastModifiedBy,
        uploadedAt: document.lastModified,
        changes: 'Current version of the document',
        filePath: document.sharePointPath,
        isCurrent: true
      };
      setVersions([fallbackVersion]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRevisionExpansion = (revisionId: string) => {
    const newExpanded = new Set(expandedRevisions);
    if (newExpanded.has(revisionId)) {
      newExpanded.delete(revisionId);
    } else {
      newExpanded.add(revisionId);
    }
    setExpandedRevisions(newExpanded);
  };

  const handleDownloadVersion = (version: VersionData) => {
    // In a real app, this would download the specific version
    console.log("Downloading version:", version.version, "of document:", document?.name);
    
    if (version.downloadUrl) {
      // Use the actual download URL if available
      window.open(version.downloadUrl, '_blank');
    } else {
      // Create a temporary link to simulate download
      const link = window.document.createElement('a');
      link.href = '#';
      link.download = `${version.fileName || document?.fileName || 'document'}_v${version.version}.${version.fileType || document?.fileType || 'pdf'}`;
      link.click();
    }
  };

  if (!document) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Version History</div>
              <div className="text-sm font-normal text-gray-600">
                {document.name}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="p-6 space-y-6">
            {/* Compact Document Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="p-2 bg-blue-500/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                  <Hash className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-blue-700">v{document.version}</div>
                <div className="text-xs text-blue-600 font-medium">Current</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="p-2 bg-green-500/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                  <History className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-700">
                  {isLoading ? <Skeleton className="h-7 w-8 mx-auto" /> : versions.length}
                </div>
                <div className="text-xs text-green-600 font-medium">Total</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="p-2 bg-purple-500/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-700">
                  {formatDate(document.lastModified).split(',')[0]}
                </div>
                <div className="text-xs text-purple-600 font-medium">Modified</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="p-2 bg-orange-500/20 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-sm font-bold text-orange-700 truncate">
                  {document.lastModifiedBy}
                </div>
                <div className="text-xs text-orange-600 font-medium">Author</div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Error loading version history: {error}</span>
                </div>
              </div>
            )}

            {/* Version Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Version Timeline</h3>
                <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 border-blue-200">
                  {versions.length} version{versions.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {isLoading ? (
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-2/3 mx-auto" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-1/2 mx-auto" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-600 mb-1">No Version History</h4>
                  <p className="text-gray-500 text-sm">
                    This document doesn't have any previous versions yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => {
                    const isExpanded = expandedRevisions.has(version.id);
                    const isCurrentVersion = version.isCurrent;
                    
                    return (
                      <div key={version.id} className="group">
                        {/* Version Card - Compact Design */}
                        <Card className={`transition-all duration-200 hover:shadow-md border-l-4 ${
                          isCurrentVersion 
                            ? 'border-l-blue-500 bg-blue-50/50' 
                            : 'border-l-gray-300 hover:border-l-gray-400'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              {/* Left Side - Version Info */}
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Version Badge */}
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={isCurrentVersion ? "default" : "secondary"}
                                    className="text-xs font-medium px-2 py-1"
                                  >
                                    v{version.version}
                                  </Badge>
                                  {isCurrentVersion && (
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Current
                                    </Badge>
                                  )}
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="font-medium text-gray-700">{version.uploadedBy}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(version.uploadedAt)}</span>
                                  </div>
                                  {version.fileSize && (
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      <span>{formatFileSize(version.fileSize)}</span>
                                    </div>
                                  )}
                                  {version.fileType && (
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      <span className="uppercase text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                        {version.fileType}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Side - Actions */}
                              <div className="flex items-center gap-2">
                                {/* Expand Details Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRevisionExpansion(version.id)}
                                  className="h-7 px-2 text-xs hover:bg-gray-100"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>

                                {/* Action Buttons */}
                                {onViewVersion && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onViewVersion(version.version)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadVersion(version)}
                                  className="h-7 px-2 text-xs"
                                >
                                  <FileDown className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Details - Compact */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="bg-white rounded-lg p-3 border">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Version Details</h4>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {version.changes}
                                  </p>
                                  
                                  {version.description && (
                                    <div className="text-sm text-gray-600 mb-2">
                                      <strong>Description:</strong> {version.description}
                                    </div>
                                  )}
                                  
                                  {version.filePath && (
                                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                                      <strong>Path:</strong> {version.filePath}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compact Info Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Version Management</h4>
                  <p className="text-gray-600 text-sm">
                    Each version represents a complete snapshot. Expand entries to view details or download specific versions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
