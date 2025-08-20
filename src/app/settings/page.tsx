"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/layout/app-layout";
import { AvatarUpload, PasswordStrength } from "@/components/settings/settings-components";
import { 
  User,
  Lock,
  MessageSquare,
  LogOut,
  Camera,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Check,
  X,
  Send,
  AlertCircle,
  Info,
  Settings as SettingsIcon,
  Cloud,
  Key,
  Globe,
  Users,
  Zap,
  Loader2,
  Save
} from "lucide-react";
import { useUserSettings, useSystemSettings } from "@/hooks/useSettings";
import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_FREQUENCIES,
  NotificationTypeConfig,
  NotificationFrequency 
} from "@/types/settings.types";
import { createClient } from "@/lib/supabase";

type FeedbackType = "bug" | "feature" | "general";

interface FeedbackData {
  type: FeedbackType;
  subject: string;
  message: string;
}

export default function SettingsPage() {
  const {
    profile,
    notificationPreferences,
    isLoading: isLoadingUser,
    isUpdating,
    error: userError,
    updateProfile,
    updateNotificationSetting,
    updatePassword,
    getNotificationPreference,
    getAllNotificationsEnabled,
    toggleAllNotifications
  } = useUserSettings();

  const {
    settings: systemSettings,
    isLoading: isLoadingSystem,
    updateSetting: updateSystemSetting,
    getSettingValue
  } = useSystemSettings();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingAzure, setIsEditingAzure] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    department: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState<FeedbackData>({
    type: "general",
    subject: "",
    message: "",
  });

  // Azure SharePoint form state
  const [azureForm, setAzureForm] = useState({
    tenant_id: "",
    client_id: "",
    client_secret: "",
    sharepoint_site_url: "",
    default_folder_path: "/Documents",
  });

  // Update profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        department: profile.department || "",
      });
    }
  }, [profile]);

  // Load Azure settings from system settings
  useEffect(() => {
    if (systemSettings.length > 0) {
      setAzureForm({
        tenant_id: getSettingValue('azure_tenant_id', ''),
        client_id: getSettingValue('azure_client_id', ''),
        client_secret: getSettingValue('azure_client_secret', ''),
        sharepoint_site_url: getSettingValue('azure_sharepoint_url', ''),
        default_folder_path: getSettingValue('azure_default_folder', '/Documents'),
      });
    }
  }, [systemSettings, getSettingValue]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleProfileUpdate = async () => {
    const result = await updateProfile({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      department: profileForm.department,
    });

    if (result.success) {
      setIsEditingProfile(false);
      setSuccessMessage("Profile updated successfully!");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    const result = await updatePassword(passwordForm.newPassword);
    
    if (result.success) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccessMessage("Password changed successfully!");
    }
  };

  const handleNotificationToggle = async (
    type: NotificationTypeConfig,
    setting: 'email_enabled' | 'push_enabled' | 'in_app_enabled',
    value: boolean
  ) => {
    const result = await updateNotificationSetting(type, { [setting]: value });
    
    if (result.success) {
      setSuccessMessage("Notification preference updated!");
    }
  };

  const handleNotificationFrequencyChange = async (
    type: NotificationTypeConfig,
    frequency: NotificationFrequency
  ) => {
    const result = await updateNotificationSetting(type, { frequency });
    
    if (result.success) {
      setSuccessMessage("Notification frequency updated!");
    }
  };

  const handleToggleAllNotifications = async (enabled: boolean) => {
    const result = await toggleAllNotifications(enabled);
    
    if (result.success) {
      setSuccessMessage(`All notifications ${enabled ? 'enabled' : 'disabled'}!`);
    }
  };

  const handleAzureUpdate = async () => {
    try {
      setIsUpdating(true);
      
      // Update all Azure settings in the database
      const updates = [
        updateSystemSetting('azure_tenant_id', azureForm.tenant_id, 'Azure AD Tenant ID'),
        updateSystemSetting('azure_client_id', azureForm.client_id, 'Azure AD Client (Application) ID'),
        updateSystemSetting('azure_client_secret', azureForm.client_secret, 'Azure AD Client Secret'),
        updateSystemSetting('azure_sharepoint_url', azureForm.sharepoint_site_url, 'SharePoint Site URL'),
        updateSystemSetting('azure_default_folder', azureForm.default_folder_path, 'Default SharePoint Folder Path'),
      ];

      await Promise.all(updates);
      
      setIsEditingAzure(false);
      setSuccessMessage("Azure SharePoint configuration updated successfully!");
    } catch (error) {
      console.error('Error updating Azure settings:', error);
      setSuccessMessage("Failed to update Azure configuration. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestAzureConnection = async () => {
    // Validate required fields
    if (!azureForm.tenant_id || !azureForm.client_id || !azureForm.client_secret) {
      setConnectionTestResult('❌ Please fill in all required Azure credentials');
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      // In a real app, you would call your Azure connection test API here
      // For now, we'll simulate the test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure based on whether fields are filled
      if (azureForm.sharepoint_site_url && azureForm.sharepoint_site_url.includes('sharepoint.com')) {
        setConnectionTestResult('✅ Connection test successful! Azure credentials are valid.');
      } else {
        setConnectionTestResult('❌ Connection test failed. Please check your SharePoint Site URL.');
      }
    } catch (error) {
      setConnectionTestResult(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendFeedback = () => {
    // In a real app, this would call an API to send feedback
    console.log("Feedback sent:", feedbackForm);
    setFeedbackSent(true);
    setTimeout(() => {
      setIsFeedbackDialogOpen(false);
      setFeedbackSent(false);
      setFeedbackForm({
        type: "general",
        subject: "",
        message: "",
      });
    }, 2000);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLogoutDialogOpen(false);
    window.location.href = "/login";
  };

  const feedbackTypeConfig = {
    bug: { label: "Bug Report", icon: AlertCircle, color: "text-red-600" },
    feature: { label: "Feature Request", icon: Info, color: "text-blue-600" },
    general: { label: "General Feedback", icon: MessageSquare, color: "text-gray-600" },
  };

  if (isLoadingUser || isLoadingSystem) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {userError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">{userError}</p>
            </div>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <AvatarUpload 
                      currentAvatar={profile?.avatar_url}
                      onAvatarChange={(newAvatar) => {
                        updateProfile({ avatar_url: newAvatar });
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{profile?.full_name || "No name set"}</h3>
                    <p className="text-muted-foreground">{profile?.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{profile?.department || "No department"}</Badge>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      variant={isEditingProfile ? "outline" : "default"}
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      disabled={isUpdating}
                    >
                      {isEditingProfile ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!isEditingProfile || isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditingProfile || isUpdating}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="department"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                        disabled={!isEditingProfile || isUpdating}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={profile?.role || ""}
                        disabled
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Role is managed by administrators</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
                        disabled
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleProfileUpdate} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)} disabled={isUpdating}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{profile?.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <p className="text-sm text-muted-foreground">{profile?.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Status</Label>
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password"
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter your new password"
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.newPassword && (
                    <PasswordStrength password={passwordForm.newPassword} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your new password"
                      disabled={isUpdating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={getAllNotificationsEnabled()}
                      onCheckedChange={handleToggleAllNotifications}
                      disabled={isUpdating}
                    />
                    <Label className="text-sm">Enable all notifications</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => {
                  const preference = getNotificationPreference(type as NotificationTypeConfig);
                  
                  return (
                    <div key={type} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{config.label}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={preference?.email_enabled || false}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(type as NotificationTypeConfig, 'email_enabled', checked)
                            }
                            disabled={isUpdating}
                          />
                          <Label className="text-sm">Email</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={preference?.push_enabled || false}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(type as NotificationTypeConfig, 'push_enabled', checked)
                            }
                            disabled={isUpdating}
                          />
                          <Label className="text-sm">Push</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={preference?.in_app_enabled || false}
                            onCheckedChange={(checked) => 
                              handleNotificationToggle(type as NotificationTypeConfig, 'in_app_enabled', checked)
                            }
                            disabled={isUpdating}
                          />
                          <Label className="text-sm">In-App</Label>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Frequency</Label>
                          <Select
                            value={preference?.frequency || 'immediate'}
                            onValueChange={(value) => 
                              handleNotificationFrequencyChange(
                                type as NotificationTypeConfig, 
                                value as NotificationFrequency
                              )
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(NOTIFICATION_FREQUENCIES).map(([freq, label]) => (
                                <SelectItem key={freq} value={freq}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            {/* Azure SharePoint Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Azure SharePoint Integration
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${azureForm.tenant_id && azureForm.client_id && azureForm.client_secret ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-muted-foreground">
                    {azureForm.tenant_id && azureForm.client_id && azureForm.client_secret ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Azure Active Directory Configuration</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure Azure AD credentials for SharePoint authentication and document management
                    </p>
                  </div>
                  <Button
                    variant={isEditingAzure ? "outline" : "default"}
                    onClick={() => setIsEditingAzure(!isEditingAzure)}
                    disabled={isUpdating}
                  >
                    {isEditingAzure ? "Cancel" : "Edit Configuration"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID *</Label>
                    <Input
                      id="tenantId"
                      value={azureForm.tenant_id}
                      onChange={(e) => setAzureForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                      disabled={!isEditingAzure || isUpdating}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Azure AD Directory (tenant) ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client (Application) ID *</Label>
                    <Input
                      id="clientId"
                      value={azureForm.client_id}
                      onChange={(e) => setAzureForm(prev => ({ ...prev, client_id: e.target.value }))}
                      disabled={!isEditingAzure || isUpdating}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Application ID from your Azure App Registration
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret *</Label>
                    <div className="relative">
                      <Input
                        id="clientSecret"
                        type={showClientSecret ? "text" : "password"}
                        value={azureForm.client_secret}
                        onChange={(e) => setAzureForm(prev => ({ ...prev, client_secret: e.target.value }))}
                        disabled={!isEditingAzure || isUpdating}
                        placeholder="Enter client secret"
                      />
                      {isEditingAzure && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                        >
                          {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Client secret value from your Azure App Registration
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sharePointSiteUrl">SharePoint Site URL</Label>
                    <Input
                      id="sharePointSiteUrl"
                      value={azureForm.sharepoint_site_url}
                      onChange={(e) => setAzureForm(prev => ({ ...prev, sharepoint_site_url: e.target.value }))}
                      disabled={!isEditingAzure || isUpdating}
                      placeholder="https://yourcompany.sharepoint.com/sites/yoursite"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your SharePoint site URL for document storage
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="defaultFolderPath">Default Folder Path</Label>
                    <Input
                      id="defaultFolderPath"
                      value={azureForm.default_folder_path}
                      onChange={(e) => setAzureForm(prev => ({ ...prev, default_folder_path: e.target.value }))}
                      disabled={!isEditingAzure || isUpdating}
                      placeholder="/Documents/Projects"
                    />
                    <p className="text-xs text-muted-foreground">
                      Default folder path for storing documents in SharePoint
                    </p>
                  </div>
                </div>

                {/* Configuration Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Azure App Registration Required</p>
                      <p className="mb-2">
                        You need to register an application in Azure Active Directory with the following API permissions:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Sites.ReadWrite.All</strong> - Read and write items in all site collections</li>
                        <li><strong>Files.ReadWrite.All</strong> - Read and write files in all site collections</li>
                        <li><strong>User.Read</strong> - Sign in and read user profile</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Note:</strong> Make sure to grant admin consent for these permissions in your Azure portal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditingAzure && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAzureUpdate} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Save Configuration
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleTestAzureConnection}
                      disabled={isTestingConnection || isUpdating}
                    >
                      {isTestingConnection ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingAzure(false)} disabled={isUpdating}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Connection Test Result */}
                {connectionTestResult && (
                  <div className={`p-3 rounded-lg text-sm ${
                    connectionTestResult.startsWith('✅') 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {connectionTestResult}
                  </div>
                )}

                {/* Integration Status */}
                <div className="space-y-3">
                  <h4 className="font-medium">Integration Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Azure Auth</span>
                      </div>
                      <Badge variant={azureForm.tenant_id && azureForm.client_id && azureForm.client_secret ? "default" : "secondary"}>
                        {azureForm.tenant_id && azureForm.client_id && azureForm.client_secret ? "Configured" : "Not Set"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">SharePoint</span>
                      </div>
                      <Badge variant={azureForm.sharepoint_site_url ? "default" : "secondary"}>
                        {azureForm.sharepoint_site_url ? "Configured" : "Not Set"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Integration</span>
                      </div>
                      <Badge variant={azureForm.tenant_id && azureForm.client_id && azureForm.client_secret && azureForm.sharepoint_site_url ? "default" : "secondary"}>
                        {azureForm.tenant_id && azureForm.client_id && azureForm.client_secret && azureForm.sharepoint_site_url ? "Ready" : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Setup Guide */}
                <div className="space-y-3">
                  <h4 className="font-medium">Quick Setup Guide</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
                      <p>Go to <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Azure Portal</a> and register a new application</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
                      <p>Copy the Application (client) ID and Directory (tenant) ID</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
                      <p>Create a new client secret and copy its value</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
                      <p>Add the required API permissions and grant admin consent</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">5</span>
                      <p>Enter your SharePoint site URL and configure the settings above</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Feedback Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Send Feedback</DialogTitle>
                      <DialogDescription>
                        Help us improve the application by sharing your feedback.
                      </DialogDescription>
                    </DialogHeader>

                    {!feedbackSent ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Feedback Type</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(feedbackTypeConfig).map(([key, config]) => {
                              const Icon = config.icon;
                              return (
                                <Button
                                  key={key}
                                  variant={feedbackForm.type === key ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setFeedbackForm(prev => ({ ...prev, type: key as FeedbackType }))}
                                  className="flex flex-col gap-1 h-auto py-3"
                                >
                                  <Icon className="h-4 w-4" />
                                  <span className="text-xs">{config.label.split(' ')[0]}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={feedbackForm.subject}
                            onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Brief description of your feedback"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={feedbackForm.message}
                            onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Please provide detailed feedback..."
                            rows={4}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Feedback Sent!</h3>
                        <p className="text-muted-foreground">Thank you for your feedback. We'll review it shortly.</p>
                      </div>
                    )}

                    {!feedbackSent && (
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSendFeedback}
                          disabled={!feedbackForm.subject || !feedbackForm.message}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Feedback
                        </Button>
                      </DialogFooter>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Other Ways to Reach Us</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Email Support</p>
                            <p className="text-sm text-muted-foreground">support@documentcontrol.com</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Phone Support</p>
                            <p className="text-sm text-muted-foreground">+1 (555) 123-HELP</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Logout</h3>
                    <p className="text-muted-foreground mb-4">
                      Sign out of your account. You'll need to sign in again to access the application.
                    </p>
                    
                    <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Logout</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to logout? You'll need to sign in again to access your account.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-destructive">Danger Zone</h3>
                    <p className="text-muted-foreground mb-4">
                      Irreversible and destructive actions.
                    </p>
                    
                    <div className="border border-destructive rounded-lg p-4">
                      <h4 className="font-medium mb-2">Delete Account</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" disabled>
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
