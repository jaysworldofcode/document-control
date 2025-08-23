"use client";

import React, { useState } from 'react';
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
  AlertCircle
} from "lucide-react";
import { Project } from "@/types/project.types";

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
    sharePointSiteUrl: project.sharePointConfig?.siteUrl || '',
    sharePointDocumentLibrary: project.sharePointConfig?.documentLibrary || 'Documents',
    sharePointExcelPath: project.sharePointConfig?.excelSheetPath || '',
    enableExcelLogging: project.sharePointConfig?.isExcelLoggingEnabled || false,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
    setSuccessMessage("");
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (field: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push('Project name is required');
    }

    if (!formData.description.trim()) {
      newErrors.push('Project description is required');
    }

    if (!formData.sharePointSiteUrl.trim()) {
      newErrors.push('SharePoint site URL is required');
    }

    if (!formData.sharePointDocumentLibrary.trim()) {
      newErrors.push('SharePoint document library is required');
    }

    if (formData.enableExcelLogging && !formData.sharePointExcelPath.trim()) {
      newErrors.push('SharePoint Excel path is required when Excel logging is enabled');
    }

    // Only validate date comparison if both dates are provided
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.push('Start date must be before end date');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSaveGeneralSettings = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<Project> = {
        name: formData.name,
        description: formData.description,
        status: formData.status as any,
        priority: formData.priority as any,
        client: formData.client,
        budget: formData.budget,
        startDate: formData.startDate,
        endDate: formData.endDate,
        sharePointConfig: {
          ...project.sharePointConfig,
          siteUrl: formData.sharePointSiteUrl,
          documentLibrary: formData.sharePointDocumentLibrary,
          excelSheetPath: formData.sharePointExcelPath,
          isExcelLoggingEnabled: formData.enableExcelLogging,
        }
      };

      await onUpdateProject(updates);
      setSuccessMessage('Project settings updated successfully');
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to update project settings. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveProject = async () => {
    setIsSubmitting(true);
    try {
      await onArchiveProject();
      setShowArchiveDialog(false);
      setSuccessMessage('Project archived successfully');
    } catch (error) {
      setErrors(['Failed to archive project. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteProject();
      setShowDeleteDialog(false);
      // Navigation will be handled by parent component
    } catch (error) {
      setErrors(['Failed to delete project. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
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

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <span className="font-medium text-green-800">{successMessage}</span>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Enter client name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveGeneralSettings}
              disabled={isSubmitting || loading}
            >
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
            Configure document storage and logging settings
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
              className="font-mono"
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
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              The name of the document library within the SharePoint site
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              checked={formData.enableExcelLogging}
              onCheckedChange={(checked) => handleInputChange('enableExcelLogging', checked)}
            />
            <div>
              <Label>Enable Excel Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log document activities to a SharePoint Excel sheet
              </p>
            </div>
          </div>

          {formData.enableExcelLogging && (
            <div className="space-y-2">
              <Label htmlFor="excelPath">Excel Sheet Path</Label>
              <Input
                id="excelPath"
                value={formData.sharePointExcelPath}
                onChange={(e) => handleInputChange('sharePointExcelPath', e.target.value)}
                placeholder="/sites/company/projects/project-name/logs.xlsx"
                className="font-mono"
              />
            </div>
          )}
        </CardContent>
      </Card>

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
                  {key === 'emailOnStatusChange' && 'Receive emails when document status changes'}
                  {key === 'emailOnDeadlineApproach' && 'Receive emails when project deadlines approach'}
                  {key === 'slackIntegration' && 'Send notifications to Slack channels'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => handleNotificationChange(key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions & Security
          </CardTitle>
          <CardDescription>
            Control access and security settings for this project
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
                  {key === 'restrictSharePointAccess' && 'Restrict direct SharePoint access to authorized users only'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => handlePermissionChange(key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div>
              <h4 className="font-medium">Archive Project</h4>
              <p className="text-sm text-muted-foreground">
                Move this project to archived status. Can be restored later.
              </p>
            </div>
            <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Archive Project</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to archive "{project.name}"? This will move the project to archived status, but all data will be preserved and can be restored later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleArchiveProject}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Archive Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-destructive">Delete Project</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all associated data. This cannot be undone.
              </p>
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Project</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to permanently delete "{project.name}"? This action cannot be undone and will remove:
                    <br />
                    <br />
                    • All project documents and files
                    <br />
                    • All team member assignments
                    <br />
                    • All project history and metadata
                    <br />
                    • All custom field configurations
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteProject}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
