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
  Eye
} from "lucide-react";

interface VersionHistoryModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onViewVersion?: (version: string) => void;
}

export function VersionHistoryModal({ 
  document, 
  isOpen, 
  onClose,
  onViewVersion 
}: VersionHistoryModalProps) {
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());

  if (!document) return null;

  const toggleRevisionExpansion = (revisionId: string) => {
    const newExpanded = new Set(expandedRevisions);
    if (newExpanded.has(revisionId)) {
      newExpanded.delete(revisionId);
    } else {
      newExpanded.add(revisionId);
    }
    setExpandedRevisions(newExpanded);
  };

  const handleDownloadVersion = (revision: DocumentRevision) => {
    // In a real app, this would download the specific version
    console.log("Downloading version:", revision.version, "of document:", document.name);
    // Create a temporary link to simulate download
    const link = window.document.createElement('a');
    link.href = '#';
    link.download = `${document.fileName.replace(/\.[^/.]+$/, "")}_v${revision.version}.${document.fileType}`;
    link.click();
  };

  const getVersionType = (currentVersion: string, revisionVersion: string): string => {
    if (currentVersion === revisionVersion) return "Current";
    return "Previous";
  };

  const getVersionBadgeVariant = (currentVersion: string, revisionVersion: string) => {
    if (currentVersion === revisionVersion) return "default";
    return "secondary";
  };

  // Sort revisions by version (newest first)
  const sortedRevisions = [...document.revisionHistory].sort((a, b) => {
    const aVersion = parseFloat(a.version);
    const bVersion = parseFloat(b.version);
    return bVersion - aVersion;
  });

  // Add current version to the list if it's not in revision history
  const currentVersionInHistory = sortedRevisions.some(rev => rev.version === document.version);
  const allVersions = currentVersionInHistory ? sortedRevisions : [
    {
      id: `current-${document.version}`,
      version: document.version,
      uploadedBy: document.lastModifiedBy,
      uploadedAt: document.lastModified,
      changes: "Current version",
      filePath: document.sharePointPath
    },
    ...sortedRevisions
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History - {document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto">
          <div className="space-y-4">
            {/* Document Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Current Version</span>
                    <p className="font-medium">v{document.version}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Versions</span>
                    <p className="font-medium">{allVersions.length}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Last Modified</span>
                    <p className="font-medium">
                      {new Date(document.lastModified).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Version Timeline */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Version Timeline
              </h3>

              {allVersions.map((revision, index) => {
                const isExpanded = expandedRevisions.has(revision.id);
                const isCurrentVersion = revision.version === document.version;
                
                return (
                  <Card key={revision.id} className={isCurrentVersion ? "ring-2 ring-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Version Timeline Indicator */}
                          <div className="flex flex-col items-center mt-1">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isCurrentVersion 
                                ? 'bg-primary border-primary' 
                                : 'bg-muted border-muted-foreground'
                            }`} />
                            {index < allVersions.length - 1 && (
                              <div className="w-0.5 h-8 bg-muted-foreground/30 mt-1" />
                            )}
                          </div>

                          {/* Version Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={getVersionBadgeVariant(document.version, revision.version)}
                                className="flex items-center gap-1"
                              >
                                <Hash className="h-3 w-3" />
                                v{revision.version}
                              </Badge>
                              {isCurrentVersion && (
                                <Badge variant="outline" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {getVersionType(document.version, revision.version)} Version
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {revision.uploadedBy}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(revision.uploadedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>

                            {/* Version Changes Preview */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRevisionExpansion(revision.id)}
                                className="h-6 px-2 text-xs"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                )}
                                {revision.changes ? 'View Changes' : 'View Details'}
                              </Button>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <h4 className="text-sm font-medium mb-2">Version Details</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {revision.changes || 'No change description available.'}
                                </p>
                                
                                {revision.filePath && (
                                  <div className="text-xs text-muted-foreground">
                                    <strong>File Path:</strong> {revision.filePath}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                          {onViewVersion && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewVersion(revision.version)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadVersion(revision)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Version Comparison Note */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Version Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Each version represents a complete snapshot of the document at that point in time. 
                      You can download any previous version or view its details by expanding the version entry.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
