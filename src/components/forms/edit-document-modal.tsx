"use client";

import React, { useState, useEffect } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  History,
  Info,
  Clock
} from "lucide-react";
import { Project, CustomField } from "@/types/project.types";
import { Document, DocumentStatus, DocumentUploadData } from "@/types/document.types";
import { DOCUMENT_STATUS_CONFIG } from "@/constants/document.constants";

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentUpdateData) => Promise<void>;
  document: Document;
  project: Project;
  loading?: boolean;
}

export interface DocumentUpdateData {
  file?: File; // Optional - only if uploading new version
  description: string;
  tags: string[];
  status: DocumentStatus;
  customFieldValues: Record<string, any>;
  versionNotes: string; // Required when uploading new version
  isNewVersion: boolean;
}

export function EditDocumentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  document,
  project, 
  loading = false 
}: EditDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState(document.description || "");
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(document.customFieldValues || {});
  const [versionNotes, setVersionNotes] = useState("");
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute values for rule-based fields
  const computeRuleBasedValue = (field: CustomField, values: Record<string, any>) => {
    if (!field.rule || !field.readOnly) return values[field.name] || values[field.id];
    
    // If formula is present, use it for more complex concatenation
    if (field.rule.formula) {
      let result = field.rule.formula;
      
      // Replace each field reference with its value
      project.customFields.forEach(sourceField => {
        const fieldToken = `{${sourceField.name}}`;
        const fieldValue = values[sourceField.name] || values[sourceField.id] || '';
        result = result.replace(new RegExp(fieldToken, 'g'), fieldValue);
      });
      
      return result;
    }
    
    // Fall back to simple concatenation with separator if no formula
    const { sourceFields, separator } = field.rule;
    let result = '';
    
    sourceFields.forEach((sourceId, index) => {
      const sourceField = project.customFields.find(f => f.id === sourceId);
      if (sourceField) {
        const sourceValue = values[sourceField.name] || values[sourceField.id] || '';
        
        if (sourceValue) {
          if (result && index > 0) {
            result += separator || '';
          }
          result += sourceValue;
        }
      }
    });
    
    return result;
  };
  
  // Update rule-based fields whenever source fields change
  const updateRuleBasedFields = (newValues: Record<string, any>, changedFieldName?: string) => {
    const updatedValues = { ...newValues };
    
    project.customFields.forEach(field => {
      // Only update auto-generated fields when:
      // 1. They have a rule defined
      // 2. The field that changed is one of their source fields OR no specific field was indicated (initial load)
      if (field.rule && field.readOnly) {
        const shouldUpdate = !changedFieldName || // Initial load
          (field.rule.sourceFields.some(sourceId => {
            const sourceField = project.customFields.find(f => f.id === sourceId);
            return sourceField?.name === changedFieldName;
          })); // Source field changed
        
        if (shouldUpdate) {
          updatedValues[field.name] = computeRuleBasedValue(field, updatedValues);
        }
      }
    });
    
    return updatedValues;
  };

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      setDescription(document.description || "");
      setTags(document.tags || []);
      setStatus(document.status);
      
      // Initialize custom field values and update rule-based fields
      const initialValues = document.customFieldValues || {};
      const valuesWithRules = updateRuleBasedFields(initialValues);
      setCustomFieldValues(valuesWithRules);
      
      setVersionNotes("");
      setIsNewVersion(false);
      setFile(null);
      setErrors([]);
    }
  }, [document, project.customFields]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsNewVersion(true);
      setErrors(errors.filter(e => !e.includes('file')));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setIsNewVersion(false);
    setVersionNotes("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const renderCustomField = (field: CustomField) => {
    // Try to get value by field.id first, then by field.name (for backwards compatibility)
    const value = customFieldValues[field.id] || customFieldValues[field.name] || '';
    
    // Use field.name as the key for storing values (to maintain consistency with existing data)
    const fieldKey = field.name;

    // Handler to update field value and trigger auto-generation
    const handleFieldChange = (newValue: string) => {
      const newValues = {
        ...customFieldValues,
        [fieldKey]: newValue
      };
      
      // Update rule-based fields after this field changes
      const updatedValues = updateRuleBasedFields(newValues, fieldKey);
      setCustomFieldValues(updatedValues);
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => setCustomFieldValues({
                ...customFieldValues,
                [field.id]: checked
              })}
            />
            <Label className="text-sm">
              {field.placeholder || 'Enable this option'}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setCustomFieldValues({
              ...customFieldValues,
              [field.id]: e.target.value
            })}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (isNewVersion && !file) {
      newErrors.push('Please select a file for the new version');
    }

    if (isNewVersion && !versionNotes.trim()) {
      newErrors.push('Version notes are required when uploading a new version');
    }

    // Validate required custom fields
    project.customFields.forEach(field => {
      if (field.required && !customFieldValues[field.id]) {
        newErrors.push(`${field.label} is required`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    console.log("Edit modal submitting with customFieldValues:", customFieldValues);

    setIsSubmitting(true);
    try {
      await onSubmit({
        file: file || undefined,
        description,
        tags,
        status,
        customFieldValues,
        versionNotes,
        isNewVersion
      });
      
      onClose();
    } catch (error) {
      setErrors(['Failed to update document. Please try again.']);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update document information and upload new versions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Current Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">File Name</Label>
                  <p className="font-medium">{document.fileName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Version</Label>
                  <p className="font-medium">{document.version}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Size</Label>
                  <p>{formatFileSize(document.fileSize)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Modified</Label>
                  <p>{formatDate(document.lastModified)}</p>
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

          {/* File Upload for New Version */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Upload New Version</Label>
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </div>
            
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
                        Only upload if you want to create a new version
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
                    <p className="text-sm font-medium text-blue-900">{file.name}</p>
                    <p className="text-xs text-blue-700">{formatFileSize(file.size)} • New version will be created</p>
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

          {/* Version Notes - Only show if uploading new version */}
          {isNewVersion && (
            <div className="space-y-2">
              <Label htmlFor="versionNotes">Version Notes *</Label>
              <Textarea
                id="versionNotes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="Describe the changes in this version..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Explain what changed in this version for future reference
              </p>
            </div>
          )}

          <Separator />

          {/* Document Status */}
          <div className="space-y-2">
            <Label>Document Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_STATUS_CONFIG).map(([statusKey, config]) => (
                  <SelectItem key={statusKey} value={statusKey}>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {config.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add tags..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {project.customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project-Specific Fields</CardTitle>
                <CardDescription>
                  Additional metadata fields for this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.customFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderCustomField(field)}
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Version History Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4" />
                Recent Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {document.revisionHistory.slice(-3).reverse().map((revision) => (
                  <div key={revision.id} className="flex items-center justify-between text-sm border-l-2 border-muted pl-3">
                    <div>
                      <span className="font-medium">v{revision.version}</span>
                      <span className="text-muted-foreground ml-2">{revision.changes}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(revision.uploadedAt)}
                    </div>
                  </div>
                ))}
                {isNewVersion && (
                  <div className="flex items-center justify-between text-sm border-l-2 border-blue-500 pl-3 bg-blue-50 py-1 px-2 rounded">
                    <div>
                      <span className="font-medium text-blue-700">
                        v{parseFloat(document.version) + 0.1} (New)
                      </span>
                      <span className="text-blue-600 ml-2">{versionNotes || 'Version notes...'}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Pending
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
              {isNewVersion ? 'Upload New Version' : 'Update Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
