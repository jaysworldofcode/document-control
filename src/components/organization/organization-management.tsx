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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building,
  Globe,
  Users,
  CreditCard,
  Check,
  X,
  Upload,
  Image,
  Info,
  AlertCircle,
  Crown,
  Shield
} from "lucide-react";
import { Organization, OrganizationSettings } from "@/types/organization.types";

interface OrganizationManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<OrganizationSettings>) => Promise<void>;
  organization: Organization;
  userRole: 'owner' | 'admin' | 'member';
  loading?: boolean;
}

export function OrganizationManagement({
  isOpen,
  onClose,
  onSave,
  organization,
  userRole,
  loading = false
}: OrganizationManagementProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    general: {
      name: organization.name,
      domain: organization.domain,
      logo: organization.logo || ''
    },
    security: {
      enforcePasswordPolicy: true,
      requireTwoFactor: false,
      sessionTimeout: 480,
      allowExternalSharing: false
    }
  });

  const [errors, setErrors] = useState<string[]>([]);

  const isOwner = userRole === 'owner';
  const canEdit = userRole === 'owner' || userRole === 'admin';

  const handleSave = async () => {
    const validationErrors: string[] = [];
    
    if (!formData.general.name) {
      validationErrors.push('Organization name is required');
    }
    
    if (!formData.general.domain) {
      validationErrors.push('Domain is required');
    }
    
    if (formData.general.domain && !/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.general.domain)) {
      validationErrors.push('Invalid domain format');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors(['Failed to save organization settings']);
    }
  };

  const handleInputChange = (section: 'general' | 'security', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setErrors([]);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('general', 'logo', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Management
          </DialogTitle>
          <DialogDescription>
            Manage your organization settings, security policies, and member access.
          </DialogDescription>
        </DialogHeader>

        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Read-Only Access</p>
                <p>You can view organization settings but cannot make changes. Contact an organization owner or admin for modifications.</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Tabs Navigation */}
          <div className="flex space-x-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'general'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building className="h-4 w-4 inline mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'security'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'plan'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Plan & Billing
            </button>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    Basic information about your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name *</Label>
                      <Input
                        id="orgName"
                        value={formData.general.name}
                        onChange={(e) => handleInputChange('general', 'name', e.target.value)}
                        placeholder="Enter organization name"
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orgDomain">Domain *</Label>
                      <Input
                        id="orgDomain"
                        value={formData.general.domain}
                        onChange={(e) => handleInputChange('general', 'domain', e.target.value)}
                        placeholder="company.com"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Organization Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.general.logo ? (
                        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                          <Building className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {canEdit && (
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label htmlFor="logo-upload">
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Logo
                              </span>
                            </Button>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommended: 256x256px, PNG or JPG
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{organization.currentUsers}</div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{organization.maxUsers}</div>
                      <div className="text-sm text-muted-foreground">Max Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Plan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Date(organization.createdAt).getFullYear()}
                      </div>
                      <div className="text-sm text-muted-foreground">Founded</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Policies</CardTitle>
                  <CardDescription>
                    Configure security settings for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isOwner && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          Only organization owners can modify security policies.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Enforce Password Policy</Label>
                        <p className="text-sm text-muted-foreground">
                          Require strong passwords for all users
                        </p>
                      </div>
                      <Button
                        variant={formData.security.enforcePasswordPolicy ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange('security', 'enforcePasswordPolicy', !formData.security.enforcePasswordPolicy)}
                        disabled={!isOwner}
                      >
                        {formData.security.enforcePasswordPolicy ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Require Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Mandate 2FA for all organization members
                        </p>
                      </div>
                      <Button
                        variant={formData.security.requireTwoFactor ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange('security', 'requireTwoFactor', !formData.security.requireTwoFactor)}
                        disabled={!isOwner}
                      >
                        {formData.security.requireTwoFactor ? "Required" : "Optional"}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Select
                        value={formData.security.sessionTimeout.toString()}
                        onValueChange={(value) => handleInputChange('security', 'sessionTimeout', parseInt(value))}
                        disabled={!isOwner}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                          <SelectItem value="1440">24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Allow External Sharing</Label>
                        <p className="text-sm text-muted-foreground">
                          Let users share documents with external parties
                        </p>
                      </div>
                      <Button
                        variant={formData.security.allowExternalSharing ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange('security', 'allowExternalSharing', !formData.security.allowExternalSharing)}
                        disabled={!isOwner}
                      >
                        {formData.security.allowExternalSharing ? "Allowed" : "Blocked"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Plan & Billing Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Your organization is on the {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)} plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium">Pro Plan</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Advanced features with increased limits
                        </p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Users:</span> {organization.currentUsers}/{organization.maxUsers}
                      </div>
                      <div>
                        <span className="font-medium">Storage:</span> Unlimited
                      </div>
                      <div>
                        <span className="font-medium">Projects:</span> Unlimited
                      </div>
                      <div>
                        <span className="font-medium">Support:</span> Priority
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline">
                          Upgrade Plan
                        </Button>
                        <Button variant="outline">
                          Billing Settings
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
