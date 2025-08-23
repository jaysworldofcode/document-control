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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { UserSelector } from "@/components/ui/user-selector";
import { Project, ProjectFormData, CustomField, CustomFieldFormData } from '@/types/project.types';
import { PROJECT_STATUSES, PROJECT_PRIORITIES, CUSTOM_FIELD_TYPES } from '@/types/project.types';
import { EXCEL_SHEET_TEMPLATES } from '@/constants/project.constants';
import { 
  Loader2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings,
  FileSpreadsheet,
  Info,
  UserPlus,
  Globe
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  project?: Project;
  loading?: boolean;
}

// Sortable Custom Field Item Component
function SortableCustomFieldItem({ 
  field, 
  onEdit, 
  onDelete 
}: { 
  field: CustomField; 
  onEdit: (id: string) => void; 
  onDelete: (id: string) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 border rounded-md bg-background ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{field.label}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{field.type}</Badge>
            {field.required && <Badge variant="secondary">Required</Badge>}
            <span>({field.name})</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(field.id)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProjectForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  project, 
  loading = false 
}: ProjectFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    managers: [],
    team: [],
    startDate: '',
    endDate: '',
    budget: '',
    client: '',
    sharePointSiteUrl: '',
    sharePointDocumentLibrary: '',
    sharePointExcelPath: '',
    enableExcelLogging: false,
    customFields: []
  });
  
  const [customFieldForm, setCustomFieldForm] = useState<CustomFieldFormData>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    helpText: '',
    options: '',
    defaultValue: ''
  });
  
  const [isEditingField, setIsEditingField] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize form data when project prop changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        managers: project.managers,
        team: project.team,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        client: project.client,
        sharePointSiteUrl: project.sharePointConfig.siteUrl || '',
        sharePointDocumentLibrary: project.sharePointConfig.documentLibrary || 'Documents',
        sharePointExcelPath: project.sharePointConfig.excelSheetPath || '',
        enableExcelLogging: project.sharePointConfig.isExcelLoggingEnabled,
        customFields: project.customFields
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        managers: [],
        team: [],
        startDate: '',
        endDate: '',
        budget: '',
        client: '',
        sharePointSiteUrl: '',
        sharePointDocumentLibrary: 'Documents',
        sharePointExcelPath: '',
        enableExcelLogging: false,
        customFields: []
      });
    }
    setErrors([]);
    setActiveTab('basic');
  }, [project, isOpen]);

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSharePointTemplateSelect = (template: string) => {
    const excelTemplate = EXCEL_SHEET_TEMPLATES.find(t => t.category === template);
    
    if (excelTemplate) {
      handleInputChange('sharePointExcelPath', excelTemplate.path);
      handleInputChange('enableExcelLogging', true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormData(prev => {
        const oldIndex = prev.customFields.findIndex(field => field.id === active.id);
        const newIndex = prev.customFields.findIndex(field => field.id === over?.id);

        return {
          ...prev,
          customFields: arrayMove(prev.customFields, oldIndex, newIndex),
        };
      });
    }
  };

  const handleAddCustomField = () => {
    if (!customFieldForm.name || !customFieldForm.label) {
      setErrors(['Field name and label are required']);
      return;
    }

    const newField: CustomField = {
      id: `field_${Date.now()}`,
      name: customFieldForm.name,
      label: customFieldForm.label,
      type: customFieldForm.type,
      required: customFieldForm.required,
      placeholder: customFieldForm.placeholder,
      helpText: customFieldForm.helpText,
      options: customFieldForm.type === 'select' ? customFieldForm.options?.split(',').map(o => o.trim()) : undefined,
      defaultValue: customFieldForm.defaultValue || undefined,
      order: formData.customFields.length + 1,
      isActive: true,
      validation: customFieldForm.type === 'text' ? {
        minLength: customFieldForm.validation?.minLength ? parseInt(customFieldForm.validation.minLength) : undefined,
        maxLength: customFieldForm.validation?.maxLength ? parseInt(customFieldForm.validation.maxLength) : undefined,
        pattern: customFieldForm.validation?.pattern
      } : customFieldForm.type === 'number' ? {
        min: customFieldForm.validation?.min ? parseInt(customFieldForm.validation.min) : undefined,
        max: customFieldForm.validation?.max ? parseInt(customFieldForm.validation.max) : undefined
      } : undefined
    };

    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField]
    }));

    // Reset form
    setCustomFieldForm({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      helpText: '',
      options: '',
      defaultValue: ''
    });
    setErrors([]);
  };

  const handleEditCustomField = (fieldId: string) => {
    const field = formData.customFields.find(f => f.id === fieldId);
    if (field) {
      setCustomFieldForm({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        options: field.options?.join(', ') || '',
        defaultValue: field.defaultValue?.toString() || '',
        validation: {
          minLength: field.validation?.minLength?.toString(),
          maxLength: field.validation?.maxLength?.toString(),
          min: field.validation?.min?.toString(),
          max: field.validation?.max?.toString(),
          pattern: field.validation?.pattern
        }
      });
      setIsEditingField(fieldId);
    }
  };

  const handleUpdateCustomField = () => {
    if (!isEditingField) return;

    const updatedFields = formData.customFields.map(field => {
      if (field.id === isEditingField) {
        return {
          ...field,
          name: customFieldForm.name,
          label: customFieldForm.label,
          type: customFieldForm.type,
          required: customFieldForm.required,
          placeholder: customFieldForm.placeholder,
          helpText: customFieldForm.helpText,
          options: customFieldForm.type === 'select' ? customFieldForm.options?.split(',').map(o => o.trim()) : undefined,
          defaultValue: customFieldForm.defaultValue || undefined
        };
      }
      return field;
    });

    setFormData(prev => ({ ...prev, customFields: updatedFields }));
    setIsEditingField(null);
    setCustomFieldForm({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      helpText: '',
      options: '',
      defaultValue: ''
    });
  };

  const handleDeleteCustomField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== fieldId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const validationErrors: string[] = [];
    if (!formData.name) validationErrors.push('Project name is required');
    if (!formData.description) validationErrors.push('Project description is required');
    if (!formData.managers || formData.managers.length === 0) validationErrors.push('At least one project manager is required');
    if (!formData.startDate) validationErrors.push('Start date is required');
    if (!formData.sharePointSiteUrl) validationErrors.push('SharePoint site URL is required');
    if (!formData.sharePointDocumentLibrary) validationErrors.push('SharePoint document library is required');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to save project']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Update project information, SharePoint configuration, and custom fields.' 
              : 'Create a new project with SharePoint integration and custom document fields.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Please fix the following errors:</p>
                <ul className="mt-1 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="sharepoint">SharePoint Integration</TabsTrigger>
              <TabsTrigger value="fields">Custom Fields</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                    placeholder="Client name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the project objectives and scope..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Managers *</Label>
                  <div className="space-y-2">
                    {formData.managers.map((manager, index) => (
                      <div key={manager.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{manager.name}</div>
                          <div className="text-sm text-muted-foreground">{manager.email}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {manager.isPrimaryManager && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                          {manager.canApproveDocuments && (
                            <Badge variant="outline" className="text-xs">Can Approve</Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newManagers = formData.managers.filter((_, i) => i !== index);
                            handleInputChange('managers', newManagers);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsUserSelectorOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Manager
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="e.g., $50,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* SharePoint Integration Tab */}
            <TabsContent value="sharepoint" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    SharePoint Site Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure the SharePoint site and document library for this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sharePointSiteUrl">SharePoint Site URL *</Label>
                    <Input
                      id="sharePointSiteUrl"
                      value={formData.sharePointSiteUrl}
                      onChange={(e) => handleInputChange('sharePointSiteUrl', e.target.value)}
                      placeholder="https://company.sharepoint.com/sites/projectname"
                    />
                    <p className="text-xs text-muted-foreground">
                      The SharePoint site URL where project documents will be stored
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sharePointDocumentLibrary">Document Library Name</Label>
                    <Input
                      id="sharePointDocumentLibrary"
                      value={formData.sharePointDocumentLibrary}
                      onChange={(e) => handleInputChange('sharePointDocumentLibrary', e.target.value)}
                      placeholder="Documents"
                    />
                    <p className="text-xs text-muted-foreground">
                      The name of the document library within the SharePoint site (default: Documents)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Excel Logging Configuration
                  </CardTitle>
                  <CardDescription>
                    Optional: Log document uploads to an Excel sheet for tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableExcelLogging"
                      checked={formData.enableExcelLogging}
                      onCheckedChange={(checked) => handleInputChange('enableExcelLogging', checked)}
                    />
                    <Label htmlFor="enableExcelLogging">Enable Excel Logging</Label>
                  </div>

                  {formData.enableExcelLogging && (
                    <div className="space-y-2">
                      <Label htmlFor="sharePointExcelPath">Excel Sheet Path</Label>
                      <Input
                        id="sharePointExcelPath"
                        value={formData.sharePointExcelPath}
                        onChange={(e) => handleInputChange('sharePointExcelPath', e.target.value)}
                        placeholder="/sites/CompanyDocs/Logs/DocumentLog.xlsx"
                      />
                      <p className="text-xs text-muted-foreground">
                        Path to the Excel file where document metadata will be logged
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Fields Tab */}
            <TabsContent value="fields" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Project Custom Fields
                  </CardTitle>
                  <CardDescription>
                    Define custom metadata fields that users will fill when uploading documents to this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Fields List */}
                  {formData.customFields.length > 0 && (
                    <div className="space-y-3">
                      <Label>Configured Fields</Label>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={formData.customFields.map(field => field.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {formData.customFields.map((field) => (
                              <SortableCustomFieldItem
                                key={field.id}
                                field={field}
                                onEdit={handleEditCustomField}
                                onDelete={handleDeleteCustomField}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  {/* Add/Edit Custom Field Form */}
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        {isEditingField ? 'Edit Custom Field' : 'Add Custom Field'}
                      </Label>
                      {isEditingField && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditingField(null);
                            setCustomFieldForm({
                              name: '',
                              label: '',
                              type: 'text',
                              required: false,
                              placeholder: '',
                              helpText: '',
                              options: '',
                              defaultValue: ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fieldName">Field Name</Label>
                        <Input
                          id="fieldName"
                          value={customFieldForm.name}
                          onChange={(e) => setCustomFieldForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., documentNumber"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fieldLabel">Display Label</Label>
                        <Input
                          id="fieldLabel"
                          value={customFieldForm.label}
                          onChange={(e) => setCustomFieldForm(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., Document Number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fieldType">Field Type</Label>
                        <Select 
                          value={customFieldForm.type} 
                          onValueChange={(value) => setCustomFieldForm(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CUSTOM_FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                        <Input
                          id="fieldPlaceholder"
                          value={customFieldForm.placeholder}
                          onChange={(e) => setCustomFieldForm(prev => ({ ...prev, placeholder: e.target.value }))}
                          placeholder="Placeholder text"
                        />
                      </div>
                    </div>

                    {customFieldForm.type === 'select' && (
                      <div className="space-y-2">
                        <Label htmlFor="fieldOptions">Options (comma-separated)</Label>
                        <Input
                          id="fieldOptions"
                          value={customFieldForm.options}
                          onChange={(e) => setCustomFieldForm(prev => ({ ...prev, options: e.target.value }))}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="fieldHelpText">Help Text</Label>
                      <Input
                        id="fieldHelpText"
                        value={customFieldForm.helpText}
                        onChange={(e) => setCustomFieldForm(prev => ({ ...prev, helpText: e.target.value }))}
                        placeholder="Additional information to help users"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fieldRequired"
                        checked={customFieldForm.required}
                        onCheckedChange={(checked) => setCustomFieldForm(prev => ({ ...prev, required: !!checked }))}
                      />
                      <Label htmlFor="fieldRequired">Required field</Label>
                    </div>

                    <Button
                      type="button"
                      onClick={isEditingField ? handleUpdateCustomField : handleAddCustomField}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isEditingField ? 'Update Field' : 'Add Field'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* User Selector Dialog */}
      <UserSelector
        isOpen={isUserSelectorOpen}
        onClose={() => setIsUserSelectorOpen(false)}
        onSelect={(manager) => {
          handleInputChange('managers', [...formData.managers, manager]);
        }}
        existingManagerIds={formData.managers.map(m => m.id)}
      />
    </Dialog>
  );
}
