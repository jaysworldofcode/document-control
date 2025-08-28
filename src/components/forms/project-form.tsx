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
import { Project, ProjectFormData, CustomField, CustomFieldFormData, SharePointConfigFormData, FieldRule } from '@/types/project.types';
import { PROJECT_STATUSES, PROJECT_PRIORITIES, CUSTOM_FIELD_TYPES } from '@/types/project.types';
import { FieldRuleEditor } from './field-rule-editor';
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
            {field.readOnly && field.rule && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Rule-based
              </Badge>
            )}
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
    // Multiple SharePoint configurations
    sharePointConfigs: [],
    customFields: []
  });
  
  // Store temporary rule for new field being added
  const [tempFieldRule, setTempFieldRule] = useState<{rule?: FieldRule, readOnly: boolean}>({
    rule: undefined,
    readOnly: false
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
  
  // State for new SharePoint configuration
  const [newSharePointConfig, setNewSharePointConfig] = useState<SharePointConfigFormData>({
    id: '',
    name: '',
    siteUrl: '',
    documentLibrary: 'Documents',
    folderPath: '',
    excelPath: '',
    enableExcelLogging: false
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
        sharePointConfigs: project.sharePointConfigs || [],
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
        sharePointConfigs: [],
        customFields: []
      });
    }
    setErrors([]);
    setActiveTab('basic');
  }, [project, isOpen]);

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      // Include any rule that was set during the custom field creation
      readOnly: tempFieldRule.readOnly,
      rule: tempFieldRule.rule,
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
    // Reset the temporary field rule
    setTempFieldRule({
      rule: undefined,
      readOnly: false
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
          defaultValue: customFieldForm.defaultValue || undefined,
          // Preserve rule and readOnly properties
          rule: field.rule,
          readOnly: field.readOnly
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
    
    // Reset the temporary field rule
    setTempFieldRule({
      rule: undefined,
      readOnly: false
    });
  };

  const handleDeleteCustomField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== fieldId)
    }));
  };
  
  const handleFieldRuleUpdate = (fieldId: string, rule: FieldRule | undefined, readOnly: boolean) => {
    // Check if this is a temp field (being created) or an existing field (being edited)
    const isExistingField = formData.customFields.some(f => f.id === fieldId);
    
    if (isExistingField) {
      // Update the rule for an existing field
      setFormData(prev => ({
        ...prev,
        customFields: prev.customFields.map(field => 
          field.id === fieldId 
            ? { 
                ...field, 
                rule: rule, 
                readOnly: readOnly 
              } 
            : field
        )
      }));
    } else {
      // Store the rule temporarily for a new field being added
      setTempFieldRule({ 
        rule: rule, 
        readOnly: readOnly 
      });
      
      console.log('Setting temp field rule:', { rule, readOnly });
    }
  };

  // SharePoint configuration management functions
  const addSharePointConfig = () => {
    if (!newSharePointConfig.name || !newSharePointConfig.siteUrl) {
      setErrors(['Configuration name and SharePoint site URL are required']);
      return;
    }

    const configWithId: SharePointConfigFormData = {
      ...newSharePointConfig,
      id: `sp_config_${Date.now()}`
    };

    setFormData(prev => ({
      ...prev,
      sharePointConfigs: (prev.sharePointConfigs || []).concat(configWithId)
    }));

    // Reset the form
    setNewSharePointConfig({
      id: '',
      name: '',
      siteUrl: '',
      documentLibrary: 'Documents',
      folderPath: '',
      excelPath: '',
      enableExcelLogging: false
    });
    setErrors([]);
  };

  const removeSharePointConfig = (configId: string) => {
    setFormData(prev => ({
      ...prev,
      sharePointConfigs: (prev.sharePointConfigs || []).filter(config => config.id !== configId)
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
    if (!formData.sharePointConfigs || formData.sharePointConfigs.length === 0) validationErrors.push('At least one SharePoint configuration is required');

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
                    SharePoint Configurations
                  </CardTitle>
                  <CardDescription>
                    Configure multiple SharePoint integrations for this project. You can add different configurations for different document types or teams.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing SharePoint Configurations */}
                  {formData.sharePointConfigs && formData.sharePointConfigs.length > 0 && (
                    <div className="space-y-3">
                      <Label>Configured SharePoint Sites</Label>
                      <div className="space-y-3">
                        {formData.sharePointConfigs.map((config, index) => (
                          <Card key={config.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{config.name}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSharePointConfig(config.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div>
                                <Label className="text-xs">Site URL</Label>
                                <p className="text-muted-foreground">{config.siteUrl}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs">Document Library</Label>
                                  <p className="text-muted-foreground">{config.documentLibrary}</p>
                                </div>
                                <div>
                                  <Label className="text-xs">Folder Path</Label>
                                  <p className="text-muted-foreground">{config.folderPath || 'Root'}</p>
                                </div>
                              </div>
                              {config.enableExcelLogging && (
                                <div>
                                  <Label className="text-xs">Excel Logging</Label>
                                  <p className="text-muted-foreground">Enabled: {config.excelPath}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New SharePoint Configuration */}
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="text-center space-y-2 mb-4">
                      <h4 className="font-medium">Add SharePoint Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure a new SharePoint site for document storage
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newConfigName">Configuration Name *</Label>
                        <Input
                          id="newConfigName"
                          value={newSharePointConfig.name}
                          onChange={(e) => setNewSharePointConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Main Documents, Engineering Files, Design Assets"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newConfigSiteUrl">SharePoint Site URL *</Label>
                        <Input
                          id="newConfigSiteUrl"
                          value={newSharePointConfig.siteUrl}
                          onChange={(e) => setNewSharePointConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
                          placeholder="https://company.sharepoint.com/sites/projectname"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newConfigLibrary">Document Library</Label>
                          <Input
                            id="newConfigLibrary"
                            value={newSharePointConfig.documentLibrary}
                            onChange={(e) => setNewSharePointConfig(prev => ({ ...prev, documentLibrary: e.target.value }))}
                            placeholder="Documents"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newConfigFolder">Folder Path (Optional)</Label>
                          <Input
                            id="newConfigFolder"
                            value={newSharePointConfig.folderPath}
                            onChange={(e) => setNewSharePointConfig(prev => ({ ...prev, folderPath: e.target.value }))}
                            placeholder="ProjectFiles/Engineering"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="newConfigExcelLogging"
                            checked={newSharePointConfig.enableExcelLogging}
                            onCheckedChange={(checked) => setNewSharePointConfig(prev => ({ ...prev, enableExcelLogging: checked }))}
                          />
                          <Label htmlFor="newConfigExcelLogging">Enable Excel Logging</Label>
                        </div>

                        {newSharePointConfig.enableExcelLogging && (
                          <div className="space-y-2">
                            <Label htmlFor="newConfigExcelPath">Excel Sheet URL</Label>
                            <Input
                              id="newConfigExcelPath"
                              value={newSharePointConfig.excelPath}
                              onChange={(e) => setNewSharePointConfig(prev => ({ ...prev, excelPath: e.target.value }))}
                              placeholder="https://yoursite.sharepoint.com/:x:/r/sites/TESTSITEONLY/...."
                            />
                            <p className="text-xs text-muted-foreground">
                              Path to the Excel file where document metadata will be logged
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={addSharePointConfig}
                        disabled={!newSharePointConfig.name || !newSharePointConfig.siteUrl}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add SharePoint Configuration
                      </Button>
                    </div>
                  </div>

                  {(!formData.sharePointConfigs || formData.sharePointConfigs.length === 0) && (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-300">At least one SharePoint configuration required</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          You need to configure at least one SharePoint site to store project documents.
                        </p>
                      </div>
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
                            // Reset the temporary field rule when canceling edit
                            setTempFieldRule({
                              rule: undefined,
                              readOnly: false
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

                    <div className="mt-4">
                      <Label className="text-base font-medium mb-2">Auto-Generate Field Value</Label>
                      <FieldRuleEditor
                        field={isEditingField 
                          ? (formData.customFields.find(f => f.id === isEditingField) || {
                              id: isEditingField,
                              ...customFieldForm,
                              isActive: true,
                              order: 0,
                              rule: tempFieldRule.rule,
                              readOnly: tempFieldRule.readOnly
                            } as CustomField)
                          : {
                              id: `temp_${Date.now()}`,
                              name: customFieldForm.name || '',
                              label: customFieldForm.label || '',
                              type: customFieldForm.type,
                              required: customFieldForm.required,
                              isActive: true,
                              order: 0,
                              rule: tempFieldRule.rule,
                              readOnly: tempFieldRule.readOnly
                            } as CustomField
                        }
                        allFields={[
                          ...formData.customFields,
                          // Include the current field being added if it's not in customFields yet
                          ...(isEditingField ? [] : [{
                            id: `temp_${Date.now()}`,
                            name: customFieldForm.name || '',
                            label: customFieldForm.label || '',
                            type: customFieldForm.type,
                            required: customFieldForm.required,
                            isActive: true,
                            order: formData.customFields.length + 1,
                            rule: undefined,
                            readOnly: false
                          } as CustomField])
                        ]}
                        onUpdate={handleFieldRuleUpdate}
                      />
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
