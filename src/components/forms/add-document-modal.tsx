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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Globe,
  FolderOpen,
  CheckCircle
} from "lucide-react";
import { Project, CustomField } from "@/types/project.types";
import { DocumentUploadData, DocumentUploadResult } from "@/types/document.types";

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentUploadData) => Promise<DocumentUploadResult>;
  project: Project;
  loading?: boolean;
}

export function AddDocumentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  project, 
  loading = false 
}: AddDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Compute values for rule-based fields
  const computeRuleBasedValue = (field: CustomField, values: Record<string, any>) => {
    if (!field.rule || !field.readOnly) return values[field.id];
    
    // If formula is present, use it for more complex concatenation
    if (field.rule.formula) {
      let result = field.rule.formula;
      
      // Replace each field reference with its value
      project.customFields.forEach(sourceField => {
        const fieldToken = `{${sourceField.name}}`;
        const fieldValue = values[sourceField.id] || '';
        result = result.replace(new RegExp(fieldToken, 'g'), fieldValue);
      });
      
      return result;
    }
    
    // Fall back to simple concatenation with separator if no formula
    const { sourceFields, separator } = field.rule;
    let result = '';
    
    sourceFields.forEach((sourceId, index) => {
      const sourceField = project.customFields.find(f => f.id === sourceId);
      const sourceValue = values[sourceId] || '';
      
      if (sourceValue) {
        if (result && index > 0) {
          result += separator || '';
        }
        result += sourceValue;
      }
    });
    
    return result;
  };
  
  // Update rule-based fields whenever source fields change
  const updateRuleBasedFields = (newValues: Record<string, any>, changedFieldId?: string) => {
    const updatedValues = { ...newValues };
    
    project.customFields.forEach(field => {
      // Only update auto-generated fields when:
      // 1. They have a rule defined
      // 2. The field that changed is one of their source fields OR no specific field was indicated (initial load)
      if (field.rule && field.readOnly) {
        const shouldUpdate = !changedFieldId || // Initial load
          (field.rule.sourceFields.includes(changedFieldId)); // Source field changed
        
        if (shouldUpdate) {
          updatedValues[field.id] = computeRuleBasedValue(field, updatedValues);
        }
      }
    });
    
    return updatedValues;
  };

  // Initialize custom field values
  React.useEffect(() => {
    const initialValues: Record<string, any> = {};
    
    // First set all default values
    project.customFields.forEach(field => {
      initialValues[field.id] = field.defaultValue || '';
    });
    
    // Then compute auto-generated field values (passing undefined to update all rule-based fields)
    const valuesWithRules = updateRuleBasedFields(initialValues);
    setCustomFieldValues(valuesWithRules);
  }, [project.customFields]);

  // Reset results when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setUploadResults([]);
      setUploadErrors([]);
      setShowResults(false);
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors(errors.filter(e => !e.includes('file')));
    }
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
    const value = customFieldValues[field.id] || '';
    const isAutoGenerated = field.readOnly === true && field.rule !== undefined;

    // For rule-based fields that are auto-generated, use a special styled input but keep it editable
    if (isAutoGenerated) {
      return (
        <Input
          value={value}
          onChange={(e) => {
            // Allow manual editing of auto-generated fields
            setCustomFieldValues({
              ...customFieldValues,
              [field.id]: e.target.value
            });
          }}
          className="border-blue-300 bg-blue-50/30 focus:border-blue-500"
          placeholder={`Auto-generated value: ${value || ''}`}
        />
      );
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => {
              const newValues = updateRuleBasedFields({
                ...customFieldValues,
                [field.id]: e.target.value
              }, field.id);
              setCustomFieldValues(newValues);
            }}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => {
              const newValues = updateRuleBasedFields({
                ...customFieldValues,
                [field.id]: e.target.value
              }, field.id);
              setCustomFieldValues(newValues);
            }}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const newValues = updateRuleBasedFields({
                ...customFieldValues,
                [field.id]: e.target.value
              }, field.id);
              setCustomFieldValues(newValues);
            }}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => {
              const newValues = updateRuleBasedFields({
                ...customFieldValues,
                [field.id]: e.target.value
              }, field.id);
              setCustomFieldValues(newValues);
            }}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => {
              const newValues = updateRuleBasedFields({
                ...customFieldValues,
                [field.id]: newValue
              }, field.id);
              setCustomFieldValues(newValues);
            }}
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
              onCheckedChange={(checked) => {
                const newValues = updateRuleBasedFields({
                  ...customFieldValues,
                  [field.id]: checked
                }, field.id);
                setCustomFieldValues(newValues);
              }}
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

    if (!file) {
      newErrors.push('Please select a file to upload');
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
    if (!file) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        file,
        description,
        tags,
        customFieldValues
      });
      
      // Show upload results if available
      if (result && typeof result === 'object') {
        if (result.uploadResults) {
          setUploadResults(result.uploadResults);
        }
        if (result.uploadErrors) {
          setUploadErrors(result.uploadErrors);
        }
        setShowResults(true);
      } else {
        // Reset form and close modal
        setFile(null);
        setDescription("");
        setTags([]);
        setTagInput("");
        setCustomFieldValues({});
        setErrors([]);
        onClose();
      }
    } catch (error) {
      setErrors(['Failed to upload document. Please try again.']);
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

  const handleClose = () => {
    if (showResults) {
      // Reset everything and close
      setFile(null);
      setDescription("");
      setTags([]);
      setTagInput("");
      setCustomFieldValues({});
      setErrors([]);
      setUploadResults([]);
      setUploadErrors([]);
      setShowResults(false);
    }
    onClose();
  };

  // If showing results, display upload summary
  if (showResults) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Complete
            </DialogTitle>
            <DialogDescription>
              Document has been uploaded to SharePoint locations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Summary</CardTitle>
                <CardDescription>
                  {file?.name} has been uploaded to {uploadResults.length} SharePoint location{uploadResults.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Successful Uploads */}
                {uploadResults.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-700 dark:text-green-300">
                      ✓ Successful Uploads ({uploadResults.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{result.configName}</span>
                              <Badge variant="outline" className="text-xs">
                                {result.documentLibrary}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div className="truncate">{result.siteUrl}</div>
                              {result.sharePointPath && (
                                <div className="truncate">
                                  <a 
                                    href={result.sharePointPath} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View in SharePoint
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed Uploads */}
                {uploadErrors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-700 dark:text-red-300">
                      ✗ Failed Uploads ({uploadErrors.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-red-700 dark:text-red-300">
                              {error.configName}
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400">
                              {error.error}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a new document to {project.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="file">File *</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <label htmlFor="file" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-foreground">
                      Click to upload or drag and drop
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
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
            
            {file && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
                    <div className="flex items-center gap-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.readOnly && field.rule && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Auto-generated
                        </Badge>
                      )}
                    </div>
                    {renderCustomField(field)}
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                    {field.readOnly && field.rule && (
                      <p className="text-xs text-blue-700">
                        This field is automatically generated but can be manually edited if needed.
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
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
              Upload Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
