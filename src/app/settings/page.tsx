"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2
} from "lucide-react";
import { 
  MOCK_ORGANIZATION_SETTINGS, 
  CURRENT_USER_PERMISSIONS,
  CURRENT_USER_ROLE 
} from "@/constants/organization.constants";
import { AzureFormData } from "@/types/organization.types";
import { testAzureConnection, validateAzureCredentials } from "@/utils/azure.utils";

// Mock user data
const mockUser = {
  id: "user_1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@techcorp.com",
  phone: "+1 (555) 123-4567",
  department: "Engineering",
  role: "Senior Engineer",
  avatar: "/api/placeholder/100/100",
  joinDate: "2023-01-15",
  lastLogin: "2024-08-19T10:30:00Z",
  permissions: ["read", "write", "approve"],
  preferences: {
    emailNotifications: true,
  }
};

type FeedbackType = "bug" | "feature" | "general";

interface FeedbackData {
  type: FeedbackType;
  subject: string;
  message: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState(mockUser);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isEditingAzure, setIsEditingAzure] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<string | null>(null);
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    department: user.department,
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

  // Azure credentials form state
  const [azureForm, setAzureForm] = useState<AzureFormData>({
    tenantId: MOCK_ORGANIZATION_SETTINGS.azure.tenantId,
    clientId: MOCK_ORGANIZATION_SETTINGS.azure.clientId,
    clientSecret: MOCK_ORGANIZATION_SETTINGS.azure.clientSecret,
    sharePointSiteUrl: MOCK_ORGANIZATION_SETTINGS.azure.sharePointSiteUrl,
    defaultFolderPath: MOCK_ORGANIZATION_SETTINGS.azure.defaultFolderPath,
  });

  // Organization form state
  const [organizationForm, setOrganizationForm] = useState({
    name: MOCK_ORGANIZATION_SETTINGS.general.name,
    domain: MOCK_ORGANIZATION_SETTINGS.general.domain,
    logo: MOCK_ORGANIZATION_SETTINGS.general.logo,
  });

  const handleProfileUpdate = () => {
    setUser(prev => ({
      ...prev,
      ...profileForm
    }));
    setIsEditingProfile(false);
    // In a real app, this would call an API to update the profile
    console.log("Profile updated:", profileForm);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    // In a real app, this would call an API to change the password
    console.log("Password changed");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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

  const handleLogout = () => {
    // In a real app, this would clear authentication tokens and redirect
    console.log("User logged out");
    setIsLogoutDialogOpen(false);
    // window.location.href = "/login";
  };

  const handleAzureUpdate = () => {
    // In a real app, this would call an API to update Azure credentials
    console.log("Azure credentials updated:", azureForm);
    setIsEditingAzure(false);
    // Show success message or handle API response
  };

  const handleOrganizationUpdate = () => {
    // In a real app, this would call an API to update organization details
    console.log("Organization updated:", organizationForm);
    setIsEditingOrganization(false);
    // Show success message or handle API response
  };

  const handleTestAzureConnection = async () => {
    // Validate credentials first
    const validation = validateAzureCredentials({
      tenantId: azureForm.tenantId,
      clientId: azureForm.clientId,
      clientSecret: azureForm.clientSecret
    });

    if (!validation.valid) {
      setConnectionTestResult(`❌ ${validation.error}`);
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const result = await testAzureConnection({
        tenantId: azureForm.tenantId,
        clientId: azureForm.clientId,
        clientSecret: azureForm.clientSecret
      });

      if (result.success) {
        setConnectionTestResult(`✅ ${result.message}`);
      } else {
        setConnectionTestResult(`❌ ${result.message}: ${result.error}`);
      }
    } catch (error) {
      setConnectionTestResult(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const feedbackTypeConfig = {
    bug: { label: "Bug Report", icon: AlertCircle, color: "text-red-600" },
    feature: { label: "Feature Request", icon: Info, color: "text-blue-600" },
    general: { label: "General Feedback", icon: MessageSquare, color: "text-gray-600" },
  };

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
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

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
                      currentAvatar={user.avatar}
                      onAvatarChange={(newAvatar) => {
                        setUser(prev => ({ ...prev, avatar: newAvatar }));
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
                    <p className="text-muted-foreground">{user.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{user.department}</Badge>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      variant={isEditingProfile ? "outline" : "default"}
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                      {isEditingProfile ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditingProfile}
                        className="pl-10"
                      />
                    </div>
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
                        disabled={!isEditingProfile}
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
                        disabled={!isEditingProfile}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={new Date(user.joinDate).toLocaleDateString()}
                        disabled
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleProfileUpdate}>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
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
                    <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex gap-1 mt-1">
                      {user.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
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
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {user.preferences.emailNotifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            {/* Permission Check */}
            {!CURRENT_USER_PERMISSIONS.canViewSettings ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                    <p className="text-muted-foreground">
                      You don't have permission to view organization settings. Only organization owners and admins can access this section.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Organization Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Organization Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-10 w-10 text-primary" />
                      </div>
                      <div className="flex-1">
                        {!isEditingOrganization ? (
                          <>
                            <h3 className="text-xl font-semibold">{organizationForm.name}</h3>
                            <p className="text-muted-foreground">{organizationForm.domain}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">Pro Plan</Badge>
                              <Badge variant="secondary">12/50 Users</Badge>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="orgName">Organization Name</Label>
                              <Input
                                id="orgName"
                                value={organizationForm.name}
                                onChange={(e) => setOrganizationForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter organization name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="orgDomain">Domain</Label>
                              <Input
                                id="orgDomain"
                                value={organizationForm.domain}
                                onChange={(e) => setOrganizationForm(prev => ({ ...prev, domain: e.target.value }))}
                                placeholder="company.com"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Your Role</p>
                        <Badge variant="default" className="mt-1">
                          {CURRENT_USER_ROLE.charAt(0).toUpperCase() + CURRENT_USER_ROLE.slice(1)}
                        </Badge>
                        <div className="mt-3">
                          {!isEditingOrganization ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditingOrganization(true)}
                              disabled={!CURRENT_USER_PERMISSIONS.canEditOrganization}
                            >
                              <SettingsIcon className="h-4 w-4 mr-2" />
                              Edit Details
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleOrganizationUpdate}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditingOrganization(false);
                                  setOrganizationForm({
                                    name: MOCK_ORGANIZATION_SETTINGS.general.name,
                                    domain: MOCK_ORGANIZATION_SETTINGS.general.domain,
                                    logo: MOCK_ORGANIZATION_SETTINGS.general.logo,
                                  });
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Permission notice for non-owners */}
                    {!CURRENT_USER_PERMISSIONS.canEditOrganization && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800">
                            Only organization owners can edit organization details.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Azure SharePoint Integration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5" />
                      Azure SharePoint Integration
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${MOCK_ORGANIZATION_SETTINGS.integrations.isAzureEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-muted-foreground">
                        {MOCK_ORGANIZATION_SETTINGS.integrations.isAzureEnabled ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!CURRENT_USER_PERMISSIONS.canConfigureIntegrations ? (
                      <div className="text-center p-6 bg-muted/50 rounded-lg">
                        <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Only organization owners and admins can configure Azure integration.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Azure Active Directory Configuration</h4>
                            <p className="text-sm text-muted-foreground">
                              Configure Azure AD credentials for SharePoint token authentication
                            </p>
                          </div>
                          <Button
                            variant={isEditingAzure ? "outline" : "default"}
                            onClick={() => setIsEditingAzure(!isEditingAzure)}
                          >
                            {isEditingAzure ? "Cancel" : "Edit Configuration"}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="tenantId">Tenant ID</Label>
                            <Input
                              id="tenantId"
                              value={azureForm.tenantId}
                              onChange={(e) => setAzureForm(prev => ({ ...prev, tenantId: e.target.value }))}
                              disabled={!isEditingAzure}
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="clientId">Client (Application) ID</Label>
                            <Input
                              id="clientId"
                              value={azureForm.clientId}
                              onChange={(e) => setAzureForm(prev => ({ ...prev, clientId: e.target.value }))}
                              disabled={!isEditingAzure}
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="clientSecret">Client Secret</Label>
                            <div className="relative">
                              <Input
                                id="clientSecret"
                                type={showClientSecret ? "text" : "password"}
                                value={azureForm.clientSecret}
                                onChange={(e) => setAzureForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                                disabled={!isEditingAzure}
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
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sharePointSiteUrl">SharePoint Site URL</Label>
                            <Input
                              id="sharePointSiteUrl"
                              value={azureForm.sharePointSiteUrl}
                              onChange={(e) => setAzureForm(prev => ({ ...prev, sharePointSiteUrl: e.target.value }))}
                              disabled={!isEditingAzure}
                              placeholder="https://yourcompany.sharepoint.com/sites/yoursite"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="defaultFolderPath">Default Folder Path</Label>
                            <Input
                              id="defaultFolderPath"
                              value={azureForm.defaultFolderPath}
                              onChange={(e) => setAzureForm(prev => ({ ...prev, defaultFolderPath: e.target.value }))}
                              disabled={!isEditingAzure}
                              placeholder="/Documents/Projects"
                            />
                          </div>
                        </div>

                        {/* Configuration Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-1">Azure App Registration Required</p>
                              <p>
                                You need to register an application in Azure Active Directory with the following permissions:
                              </p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Sites.ReadWrite.All</li>
                                <li>Files.ReadWrite.All</li>
                                <li>User.Read</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {isEditingAzure && (
                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleAzureUpdate}>
                              <Check className="h-4 w-4 mr-2" />
                              Save Configuration
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleTestAzureConnection}
                              disabled={isTestingConnection}
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
                            <Button variant="outline" onClick={() => setIsEditingAzure(false)}>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Azure Connection</span>
                              </div>
                              <Badge variant={MOCK_ORGANIZATION_SETTINGS.integrations.isAzureEnabled ? "default" : "secondary"}>
                                {MOCK_ORGANIZATION_SETTINGS.integrations.isAzureEnabled ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">SharePoint Sync</span>
                              </div>
                              <Badge variant={MOCK_ORGANIZATION_SETTINGS.integrations.isSharePointEnabled ? "default" : "secondary"}>
                                {MOCK_ORGANIZATION_SETTINGS.integrations.isSharePointEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                          </div>
                          {MOCK_ORGANIZATION_SETTINGS.integrations.lastSyncAt && (
                            <p className="text-xs text-muted-foreground">
                              Last sync: {new Date(MOCK_ORGANIZATION_SETTINGS.integrations.lastSyncAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Organization Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Organization Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          12 of 50 users in your organization
                        </p>
                        {CURRENT_USER_PERMISSIONS.canManageMembers && (
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Manage Members
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {['Owner', 'Admin', 'Member'].map((role, index) => (
                          <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{role}s</p>
                                <p className="text-sm text-muted-foreground">
                                  {index === 0 ? '1 user' : index === 1 ? '2 users' : '9 users'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
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
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
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
