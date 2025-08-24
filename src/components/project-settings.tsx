"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Settings,
  Save,
  AlertTriangle,
  Trash2,
  Archive,
  RefreshCw,
  FolderOpen,
  Shield,
  Bell,
  Users,
  FileText,
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  TestTube,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Project } from "@/types/project.types";
import { toast } from "@/hooks/use-toast";

interface SharePointConfig {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  client_id: string;
  client_secret: string;
  site_url: string;
  document_library: string;
  folder_path?: string;
  is_excel_logging_enabled: boolean;
  excel_sheet_path?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectSettingsProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onArchiveProject: () => Promise<void>;
  onDeleteProject: () => Promise<void>;
  loading?: boolean;
}

export function ProjectSettings({ 
  project, 
  onUpdateProject, 
  onArchiveProject, 
  onDeleteProject, 
  loading = false 
}: ProjectSettingsProps) {
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    status: project.status || 'planning',
    priority: project.priority || 'medium',
    client: project.client || '',
    budget: project.budget || '',
    startDate: formatDateForInput(project.startDate),
    endDate: formatDateForInput(project.endDate),
  });

  const [notifications, setNotifications] = useState({
    emailOnDocumentUpload: true,
    emailOnStatusChange: true,
    emailOnDeadlineApproach: true,
    slackIntegration: false,
  });

  const [permissions, setPermissions] = useState({
    allowGuestAccess: false,
    requireApprovalForUploads: true,
    allowBulkDownload: true,
    restrictSharePointAccess: false,
  });

  // SharePoint Configuration Management
  const [sharePointConfigs, setSharePointConfigs] = useState<SharePointConfig[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SharePointConfig | null>(null);
  const [configFormData, setConfigFormData] = useState({
    name: '',
    description: '',
    tenant_id: '',
    client_id: '',
    client_secret: '',
    site_url: '',
    document_library: 'Documents',
    folder_path: '',
    is_excel_logging_enabled: false,
    excel_sheet_path: '',
    is_enabled: true,
  });
  const [isConfigSubmitting, setIsConfigSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Load SharePoint configurations on component mount
  useEffect(() => {
    loadSharePointConfigs();
  }, [project.id]);

  const loadSharePointConfigs = async () => {
    setIsLoadingConfigs(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/sharepoint-configs`);
      if (response.ok) {
        const configs = await response.json();
        setSharePointConfigs(configs);
      } else {
        console.error('Failed to load SharePoint configurations');
      }
    } catch (error) {
      console.error('Error loading SharePoint configurations:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigInputChange = (field: string, value: any) => {
    setConfigFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetConfigForm = () => {
    setConfigFormData({
      name: '',
      description: '',
      tenant_id: '',
      client_id: '',
      client_secret: '',
      site_url: '',
      document_library: 'Documents',
      folder_path: '',
      is_excel_logging_enabled: false,
      excel_sheet_path: '',
      is_enabled: true,
    });
    setEditingConfig(null);
  };

  const openAddConfigModal = () => {
    resetConfigForm();
    setIsConfigModalOpen(true);
  };

  const openEditConfigModal = (config: SharePointConfig) => {
    setConfigFormData({
      name: config.name,
      description: config.description || '',
      tenant_id: config.tenant_id,
      client_id: config.client_id,
      client_secret: config.client_secret,
      site_url: config.site_url,
      document_library: config.document_library,
      folder_path: config.folder_path || '',
      is_excel_logging_enabled: config.is_excel_logging_enabled,
      excel_sheet_path: config.excel_sheet_path || '',
      is_enabled: config.is_enabled,
    });
    setEditingConfig(config);
    setIsConfigModalOpen(true);
  };

  const closeConfigModal = () => {
    setIsConfigModalOpen(false);
    resetConfigForm();
  };

  const testConnection = async (configId: string) => {
    setTestingConnection(configId);
    try {
      const response = await fetch(`/api/projects/${project.id}/sharepoint-configs/${configId}/test`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Connection Test Successful",
            description: result.message,
            variant: "default",
          });
        } else {
          toast({
            title: "Connection Test Failed",
            description: result.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Connection Test Failed",
          description: "Failed to test connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const saveConfig = async () => {
    setIsConfigSubmitting(true);
    try {
      const url = editingConfig 
        ? `/api/projects/${project.id}/sharepoint-configs/${editingConfig.id}`
        : `/api/projects/${project.id}/sharepoint-configs`;
      
      const method = editingConfig ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configFormData),
      });

      if (response.ok) {
        toast({
          title: editingConfig ? "Configuration Updated" : "Configuration Added",
          description: `SharePoint configuration "${configFormData.name}" has been ${editingConfig ? 'updated' : 'added'} successfully.`,
          variant: "default",
        });
        closeConfigModal();
        loadSharePointConfigs(); // Reload the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: "destructive",
      });
    } finally {
      setIsConfigSubmitting(false);
    }
  };

  const deleteConfig = async (configId: string, configName: string) => {
    if (!confirm(`Are you sure you want to delete the SharePoint configuration "${configName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/sharepoint-configs/${configId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Configuration Deleted",
          description: `SharePoint configuration "${configName}" has been deleted successfully.`,
          variant: "default",
        });
        loadSharePointConfigs(); // Reload the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete configuration',
        variant: "destructive",
      });
    }
  };

  const toggleConfigStatus = async (configId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/sharepoint-configs/${configId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_enabled: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Configuration Updated",
          description: `Configuration has been ${!currentStatus ? 'enabled' : 'disabled'}.`,
          variant: "default",
        });
        loadSharePointConfigs(); // Reload the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update configuration',
        variant: "destructive",
      });
    }
  };

  const handleSaveGeneralSettings = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateProject(formData);
      toast({
        title: "Settings Saved",
        description: "Project settings have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    // Implementation for saving notification settings
    toast({
      title: "Notifications Updated",
      description: "Notification preferences have been saved.",
      variant: "default",
    });
  };

  const handleSavePermissionSettings = async () => {
    // Implementation for saving permission settings
    toast({
      title: "Permissions Updated",
      description: "Permission settings have been saved.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive">Error:</span>
          </div>
          <ul className="text-sm text-destructive space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic project information and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => handleInputChange('client', e.target.value)}
                placeholder="Enter client name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
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

            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter budget amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveGeneralSettings} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SharePoint Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            SharePoint Integration
          </CardTitle>
          <CardDescription>
            Manage document storage locations and SharePoint configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration List */}
          {isLoadingConfigs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading configurations...</span>
            </div>
          ) : sharePointConfigs.length > 0 ? (
            <div className="space-y-4">
              {sharePointConfigs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{config.name}</h4>
                      <Badge variant={config.is_enabled ? "default" : "secondary"}>
                        {config.is_enabled ? "Active" : "Inactive"}
                      </Badge>
                      {config.is_excel_logging_enabled && (
                        <Badge variant="outline" className="text-xs">
                          Excel Logging
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(config.id)}
                        disabled={testingConnection === config.id}
                      >
                        {testingConnection === config.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                        Test
                      </Button> */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditConfigModal(config)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleConfigStatus(config.id, config.is_enabled)}
                      >
                        {config.is_enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteConfig(config.id, config.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Site URL:</span>
                      <span className="font-mono">{config.site_url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Document Library:</span>
                      <span>{config.document_library}</span>
                    </div>
                    {config.folder_path && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Folder Path:</span>
                        <span>{config.folder_path}</span>
                      </div>
                    )}
                    {config.description && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Description:</span>
                        <span>{config.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No SharePoint configurations</p>
              <p className="mb-4">Add your first SharePoint configuration to enable document storage.</p>
            </div>
          )}

          {/* Add New Configuration Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={openAddConfigModal} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add SharePoint Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SharePoint Configuration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit SharePoint Configuration' : 'Add SharePoint Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure SharePoint integration settings for document storage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="configName">Configuration Name *</Label>
                <Input
                  id="configName"
                  value={configFormData.name}
                  onChange={(e) => handleConfigInputChange('name', e.target.value)}
                  placeholder="e.g., Main Documents, Team Files"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="configDescription">Description</Label>
                <Input
                  id="configDescription"
                  value={configFormData.description}
                  onChange={(e) => handleConfigInputChange('description', e.target.value)}
                  placeholder="Brief description of this configuration"
                />
              </div>
            </div>

            {/* <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant ID *</Label>
                <Input
                  id="tenantId"
                  value={configFormData.tenant_id}
                  onChange={(e) => handleConfigInputChange('tenant_id', e.target.value)}
                  placeholder="Enter Azure AD tenant ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  value={configFormData.client_id}
                  onChange={(e) => handleConfigInputChange('client_id', e.target.value)}
                  placeholder="Enter Azure AD app client ID"
                />
              </div>
            </div> */}

            {/* <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input
                id="clientSecret"
                type="password"
                value={configFormData.client_secret}
                onChange={(e) => handleConfigInputChange('client_secret', e.target.value)}
                placeholder="Enter Azure AD app client secret"
              />
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="siteUrl">SharePoint Site URL *</Label>
              <Input
                id="siteUrl"
                value={configFormData.site_url}
                onChange={(e) => handleConfigInputChange('site_url', e.target.value)}
                placeholder="https://company.sharepoint.com/sites/projectname"
                className="font-mono"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentLibrary">Document Library *</Label>
                <Input
                  id="documentLibrary"
                  value={configFormData.document_library}
                  onChange={(e) => handleConfigInputChange('document_library', e.target.value)}
                  placeholder="Documents"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folderPath">Folder Path (Optional)</Label>
                <Input
                  id="folderPath"
                  value={configFormData.folder_path}
                  onChange={(e) => handleConfigInputChange('folder_path', e.target.value)}
                  placeholder="/Project Documents/2024"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={configFormData.is_excel_logging_enabled}
                onCheckedChange={(checked) => handleConfigInputChange('is_excel_logging_enabled', checked)}
              />
              <div>
                <Label>Enable Excel Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Log document activities to a SharePoint Excel sheet
                </p>
              </div>
            </div>

            {configFormData.is_excel_logging_enabled && (
              <div className="space-y-2">
                <Label htmlFor="excelSheetPath">Excel Sheet Path</Label>
                <Input
                  id="excelSheetPath"
                  value={configFormData.excel_sheet_path}
                  onChange={(e) => handleConfigInputChange('excel_sheet_path', e.target.value)}
                  placeholder="/sites/company/projects/project-name/logs.xlsx"
                  className="font-mono"
                />
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Switch
                checked={configFormData.is_enabled}
                onCheckedChange={(checked) => handleConfigInputChange('is_enabled', checked)}
              />
              <div>
                <Label>Enable Configuration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this configuration for document uploads
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeConfigModal}>
              Cancel
            </Button>
            <Button onClick={saveConfig} disabled={isConfigSubmitting}>
              {isConfigSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingConfig ? 'Update Configuration' : 'Add Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure notification preferences for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {key === 'emailOnDocumentUpload' && 'Receive emails when new documents are uploaded'}
                  {key === 'emailOnStatusChange' && 'Get notified when project status changes'}
                  {key === 'emailOnDeadlineApproach' && 'Receive reminders before project deadlines'}
                  {key === 'slackIntegration' && 'Integrate with Slack for notifications'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [key]: checked }))}
              />
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveNotificationSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions & Access
          </CardTitle>
          <CardDescription>
            Configure access control and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(permissions).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {key === 'allowGuestAccess' && 'Allow external users to access project documents'}
                  {key === 'requireApprovalForUploads' && 'Require approval before documents are published'}
                  {key === 'allowBulkDownload' && 'Allow users to download multiple documents at once'}
                  {key === 'restrictSharePointAccess' && 'Restrict direct SharePoint access to admins only'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, [key]: checked }))}
              />
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSavePermissionSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save Permission Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Project Actions
          </CardTitle>
          <CardDescription>
            Administrative actions for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={onArchiveProject}
                className="w-full"
                disabled={loading}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive Project
              </Button>
              <p className="text-xs text-muted-foreground">
                Archive this project to hide it from active projects
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                variant="destructive" 
                onClick={onDeleteProject}
                className="w-full"
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </Button>
              <p className="text-xs text-muted-foreground">
                Permanently delete this project and all its data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
