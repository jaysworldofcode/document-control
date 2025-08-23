"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  GitBranch
} from "lucide-react";
import { Document } from "@/types/document.types";

interface UploadVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    file: File;
    versionType: 'minor' | 'major';
    customVersion?: string;
    changesSummary: string;
  }) => Promise<void>;
  document: Document;
  loading?: boolean;
}

export function UploadVersionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  document,
  loading = false 
}: UploadVersionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [versionType, setVersionType] = useState<'minor' | 'major'>('minor');
  const [customVersion, setCustomVersion] = useState('');
  const [useCustomVersion, setUseCustomVersion] = useState(false);
  const [changesSummary, setChangesSummary] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate next version preview
  const calculateNextVersion = (current: string, type: 'minor' | 'major'): string => {
    const versionParts = current.split('.').map(part => parseInt(part) || 0);
    
    if (type === 'major') {
      versionParts[0] = (versionParts[0] || 0) + 1;
      versionParts[1] = 0;
    } else {
      versionParts[1] = (versionParts[1] || 0) + 1;
    }
    
    while (versionParts.length < 2) {
      versionParts.push(0);
    }
    
    return versionParts.slice(0, 2).join('.');
  };

  const nextVersion = useCustomVersion ? customVersion : calculateNextVersion(document.version, versionType);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors(errors.filter(e => !e.includes('file')));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!file) {
      newErrors.push('Please select a file for the new version');
    }

    if (!changesSummary.trim()) {
      newErrors.push('Please provide a summary of changes');
    }

    if (useCustomVersion && !customVersion.trim()) {
      newErrors.push('Please provide a custom version number');
    }

    if (useCustomVersion && customVersion && !/^\d+\.\d+(\.\d+)*$/.test(customVersion.trim())) {
      newErrors.push('Custom version must be in format X.Y or X.Y.Z (e.g., 2.0, 1.5.3)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm() || !file) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        file,
        versionType,
        customVersion: useCustomVersion ? customVersion.trim() : undefined,
        changesSummary: changesSummary.trim()
      });
      
      // Reset form
      setFile(null);
      setVersionType('minor');
      setCustomVersion('');
      setUseCustomVersion(false);
      setChangesSummary('');
      setErrors([]);
      onClose();
    } catch (error) {
      setErrors(['Failed to upload new version. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Upload New Version
          </DialogTitle>
          <DialogDescription>
            Upload a new version of "{document.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Current Version</Label>
                  <div className="font-medium">{document.version}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Name</Label>
                  <div className="font-medium">{document.fileName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Size</Label>
                  <div>{formatFileSize(document.fileSize)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div>{document.fileType.toUpperCase()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Please fix the following errors:</span>
              </div>
              <ul className="text-sm text-destructive space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">New Version File *</Label>
            
            {!file ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="mt-2">
                    <label htmlFor="file" className="cursor-pointer">
                      <span className="text-sm font-medium text-foreground">
                        Click to upload new version
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max 50MB)
                      </span>
                    </label>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">{file.name}</div>
                    <div className="text-xs text-blue-700">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Version Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Version Configuration</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseCustomVersion(!useCustomVersion)}
              >
                {useCustomVersion ? 'Use Auto Versioning' : 'Use Custom Version'}
              </Button>
            </div>

            {!useCustomVersion ? (
              <div className="space-y-3">
                <div>
                  <Label>Version Type</Label>
                  <Select
                    value={versionType}
                    onValueChange={(value: 'minor' | 'major') => setVersionType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">
                        Minor Version ({calculateNextVersion(document.version, 'minor')}) - Bug fixes, small changes
                      </SelectItem>
                      <SelectItem value="major">
                        Major Version ({calculateNextVersion(document.version, 'major')}) - Major updates, breaking changes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Next version will be: </span>
                    <Badge variant="outline">{nextVersion}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customVersion">Custom Version Number</Label>
                  <Input
                    id="customVersion"
                    value={customVersion}
                    onChange={(e) => setCustomVersion(e.target.value)}
                    placeholder="e.g., 2.0, 1.5.3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use format X.Y or X.Y.Z (e.g., 2.0, 1.5.3)
                  </p>
                </div>
                {customVersion && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">New version will be: </span>
                      <Badge variant="outline">{customVersion}</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Changes Summary */}
          <div className="space-y-2">
            <Label htmlFor="changesSummary">What Changed? *</Label>
            <Textarea
              id="changesSummary"
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              placeholder="Describe what changed in this version (e.g., 'Fixed calculation errors in section 3', 'Added new diagrams', 'Updated requirements based on client feedback')..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This information will be shown in the version history and helps team members understand what changed.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || loading}
            >
              {(isSubmitting || loading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload Version {nextVersion}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
