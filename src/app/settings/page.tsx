"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  Loader2,
  FileText
} from "lucide-react";

type FeedbackType = "bug" | "feature" | "general";

interface FeedbackData {
  type: FeedbackType;
  subject: string;
  message: string;
}

interface Organization {
  id: string;
  name: string;
  industry: string | null;
  size: string | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
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

  // Organization form state
  const [organizationForm, setOrganizationForm] = useState({
    name: organization?.name || "",
    industry: organization?.industry || "",
    size: organization?.size || "",
  });

  // SharePoint integration state
  const [isEditingSharePoint, setIsEditingSharePoint] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [sharePointForm, setSharePointForm] = useState({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    siteUrl: "",
    documentLibrary: "",
    isEnabled: false,
  });

  // Update form when user or organization data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: "",
        department: "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (organization) {
      setOrganizationForm({
        name: organization.name,
        industry: organization.industry || "",
        size: organization.size || "",
      });
    }
  }, [organization]);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/organizations', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setOrganization(data.organization);
          setMembers(data.members);
        }
      } catch (error) {
        console.error('Failed to fetch organization data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  // Fetch SharePoint configuration
  useEffect(() => {
    const fetchSharePointConfig = async () => {
      if (!user?.organizationId) {
        return;
      }

      try {
        const response = await fetch('/api/sharepoint/config', {
          credentials: 'include',
        });

        if (response.ok) {
          const config = await response.json();
          setSharePointForm({
            tenantId: config.tenantId || "",
            clientId: config.clientId || "",
            clientSecret: config.clientSecret === '••••••••••••' ? "" : config.clientSecret || "",
            siteUrl: config.siteUrl || "",
            documentLibrary: config.documentLibrary || "Documents",
            isEnabled: config.isEnabled || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch SharePoint configuration:', error);
      }
    };

    if (user) {
      fetchSharePointConfig();
    }
  }, [user]);

  // Fetch SharePoint configuration
  useEffect(() => {
    const fetchSharePointConfig = async () => {
      if (!user?.organizationId) {
        return;
      }

      try {
        const response = await fetch('/api/sharepoint/config', {
          credentials: 'include',
        });

        if (response.ok) {
          const config = await response.json();
          setSharePointForm({
            tenantId: config.tenantId || '',
            clientId: config.clientId || '',
            clientSecret: config.clientSecret === '••••••••••••' ? '' : config.clientSecret || '',
            siteUrl: config.siteUrl || '',
            documentLibrary: config.documentLibrary || 'Documents',
            isEnabled: config.isEnabled || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch SharePoint configuration:', error);
      }
    };

    if (user) {
      fetchSharePointConfig();
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        await refreshUser(); // Refresh user data from auth context
        setIsEditingProfile(false);
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.error || 'Failed to update profile',
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred while updating your profile.",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "New passwords don't match. Please try again.",
      });
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Password change failed",
          description: error.error || 'Failed to change password',
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        variant: "destructive",
        title: "Password change failed",
        description: "An unexpected error occurred while changing your password.",
      });
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
    try {
      await logout(); // Use logout from auth context
      setIsLogoutDialogOpen(false);
      // Auth context handles the redirect
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOrganizationUpdate = async () => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(organizationForm),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setIsEditingOrganization(false);
        toast({
          title: "Organization updated",
          description: "Your organization details have been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.error || 'Failed to update organization',
        });
      }
    } catch (error) {
      console.error('Organization update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An unexpected error occurred while updating your organization.",
      });
    }
  };

  const handleTestSharePointConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const response = await fetch('/api/sharepoint/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tenantId: sharePointForm.tenantId,
          clientId: sharePointForm.clientId,
          clientSecret: sharePointForm.clientSecret,
          siteUrl: sharePointForm.siteUrl,
          documentLibrary: sharePointForm.documentLibrary,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setConnectionTestResult({
          success: true,
          message: "Connection successful!",
          details: result.details || "Successfully connected to SharePoint and verified document library access.",
        });
        toast({
          title: "Connection successful",
          description: "SharePoint connection test passed. All configurations are working correctly.",
        });
      } else {
        setConnectionTestResult({
          success: false,
          message: result.error || "Connection failed",
          details: result.details || "Please check your configuration and try again.",
        });
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: result.error || "Unable to connect to SharePoint. Please check your settings.",
        });
      }
    } catch (error) {
      console.error('SharePoint connection test error:', error);
      setConnectionTestResult({
        success: false,
        message: "Connection test failed",
        details: "An unexpected error occurred while testing the connection.",
      });
      toast({
        variant: "destructive",
        title: "Test failed",
        description: "An unexpected error occurred while testing the SharePoint connection.",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDisconnectSharePoint = async () => {
    try {
      const response = await fetch('/api/sharepoint/config', {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();
      
      if (response.ok) {
        setSharePointForm({
          tenantId: "",
          clientId: "",
          clientSecret: "",
          siteUrl: "",
          documentLibrary: "Documents",
          isEnabled: false,
        });
        toast({
          title: "SharePoint disconnected",
          description: "SharePoint integration has been disabled.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Disconnect failed",
          description: result.error || "Failed to disconnect SharePoint.",
        });
      }
    } catch (error) {
      console.error('SharePoint disconnect error:', error);
      toast({
        variant: "destructive",
        title: "Disconnect failed",
        description: "An unexpected error occurred while disconnecting SharePoint.",
      });
    }
  };

  const handleSaveSharePointConfiguration = async () => {
    try {
      const response = await fetch('/api/sharepoint/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tenantId: sharePointForm.tenantId,
          clientId: sharePointForm.clientId,
          clientSecret: sharePointForm.clientSecret,
          siteUrl: sharePointForm.siteUrl,
          documentLibrary: sharePointForm.documentLibrary,
          isEnabled: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSharePointForm(prev => ({ ...prev, isEnabled: true }));
        setIsEditingSharePoint(false);
        setConnectionTestResult(null); // Clear any previous test results
        toast({
          title: "SharePoint settings saved",
          description: "Your SharePoint integration has been configured successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Save failed",
          description: error.error || 'Failed to save SharePoint configuration',
        });
      }
    } catch (error) {
      console.error('SharePoint save error:', error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "An unexpected error occurred while saving SharePoint configuration.",
      });
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

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : !user ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Please log in to access settings.</p>
          </div>
        ) : (

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
                      currentAvatar={"/api/placeholder/100/100"}
                      onAvatarChange={(newAvatar) => {
                        console.log('Avatar changed:', newAvatar);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-muted-foreground">{user?.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{user?.role}</Badge>
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
                    <Label>Member Since</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value="N/A"
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
                    <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <p className="text-sm text-muted-foreground">{user?.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Organization</Label>
                    <p className="text-sm text-muted-foreground">
                      {organization?.name || 'No organization'}
                    </p>
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
                    Enabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
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
                        <h3 className="text-xl font-semibold">
                          {organization?.name || 'Loading...'}
                        </h3>
                        <p className="text-muted-foreground">
                          {organization?.industry || 'No industry specified'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {organization?.size ? `${organization.size} organization` : 'Size not specified'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default">{user?.role}</Badge>
                          <Badge variant="secondary">Active</Badge>
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
                          <Label htmlFor="orgIndustry">Industry</Label>
                          <select
                            className="w-full h-10 border border-gray-200 rounded-md px-3 focus:border-blue-500 focus:ring-blue-500 bg-white"
                            value={organizationForm.industry}
                            onChange={(e) => setOrganizationForm(prev => ({ ...prev, industry: e.target.value }))}
                          >
                            <option value="">Select industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="education">Education</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orgSize">Organization Size</Label>
                          <select
                            className="w-full h-10 border border-gray-200 rounded-md px-3 focus:border-blue-500 focus:ring-blue-500 bg-white"
                            value={organizationForm.size}
                            onChange={(e) => setOrganizationForm(prev => ({ ...prev, size: e.target.value }))}
                          >
                            <option value="">Select size</option>
                            <option value="startup">Startup (1-10 employees)</option>
                            <option value="small">Small (11-50 employees)</option>
                            <option value="medium">Medium (51-200 employees)</option>
                            <option value="large">Large (201-1000 employees)</option>
                            <option value="enterprise">Enterprise (1000+ employees)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {!isEditingOrganization ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingOrganization(true)}
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
                          onClick={() => setIsEditingOrganization(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Organization Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{members.length}</p>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-muted-foreground">Documents</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Building className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SharePoint Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  SharePoint Integration
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${sharePointForm.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-muted-foreground">
                    {sharePointForm.isEnabled ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isEditingSharePoint && !sharePointForm.isEnabled ? (
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Cloud className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Connect to SharePoint</h3>
                    <p className="text-muted-foreground mb-4">
                      Sync your documents with Microsoft SharePoint for better collaboration and storage.
                    </p>
                    <Button onClick={() => setIsEditingSharePoint(true)}>
                      <Cloud className="h-4 w-4 mr-2" />
                      Setup SharePoint Integration
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* SharePoint Configuration Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tenantId">Tenant ID</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="tenantId"
                            value={sharePointForm.tenantId}
                            onChange={(e) => setSharePointForm(prev => ({ ...prev, tenantId: e.target.value }))}
                            placeholder="Enter your Azure AD tenant ID"
                            disabled={!isEditingSharePoint}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="clientId">Client (Application) ID</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="clientId"
                            value={sharePointForm.clientId}
                            onChange={(e) => setSharePointForm(prev => ({ ...prev, clientId: e.target.value }))}
                            placeholder="Enter your app client ID"
                            disabled={!isEditingSharePoint}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="clientSecret"
                            type={showClientSecret ? "text" : "password"}
                            value={sharePointForm.clientSecret}
                            onChange={(e) => setSharePointForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                            placeholder="Enter your app client secret"
                            disabled={!isEditingSharePoint}
                            className="pl-10 pr-10"
                          />
                          {isEditingSharePoint && (
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
                        <Label htmlFor="siteUrl">SharePoint Site URL</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="siteUrl"
                            value={sharePointForm.siteUrl}
                            onChange={(e) => setSharePointForm(prev => ({ ...prev, siteUrl: e.target.value }))}
                            placeholder="https://yourcompany.sharepoint.com/sites/sitename"
                            disabled={!isEditingSharePoint}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentLibrary">Document Library Name</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="documentLibrary"
                            value={sharePointForm.documentLibrary}
                            onChange={(e) => setSharePointForm(prev => ({ ...prev, documentLibrary: e.target.value }))}
                            placeholder="Documents"
                            disabled={!isEditingSharePoint}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Connection Status and Actions */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${sharePointForm.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-medium">
                            {sharePointForm.isEnabled ? 'SharePoint Connected' : 'SharePoint Disconnected'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sharePointForm.isEnabled 
                              ? 'Documents are being synced automatically' 
                              : 'Configure settings to enable sync'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* Test Connection Button */}
                        {(isEditingSharePoint || sharePointForm.isEnabled) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleTestSharePointConnection}
                            disabled={isTestingConnection || !sharePointForm.tenantId || !sharePointForm.clientId || !sharePointForm.clientSecret || !sharePointForm.siteUrl}
                          >
                            {isTestingConnection ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4 mr-2" />
                            )}
                            {isTestingConnection ? 'Testing...' : 'Test Connection'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Connection Test Result */}
                    {connectionTestResult && (
                      <div className={`p-4 border rounded-lg ${
                        connectionTestResult.success 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          {connectionTestResult.success ? (
                            <Check className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${
                              connectionTestResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {connectionTestResult.message}
                            </p>
                            {connectionTestResult.details && (
                              <p className={`text-sm mt-1 ${
                                connectionTestResult.success ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {connectionTestResult.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isEditingSharePoint ? (
                        <>
                          <Button 
                            onClick={handleSaveSharePointConfiguration}
                            disabled={!sharePointForm.tenantId || !sharePointForm.clientId || !sharePointForm.clientSecret || !sharePointForm.siteUrl}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Save Configuration
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingSharePoint(false)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : sharePointForm.isEnabled ? (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingSharePoint(true)}
                          >
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Edit Configuration
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              setSharePointForm({
                                tenantId: "",
                                clientId: "",
                                clientSecret: "",
                                siteUrl: "",
                                documentLibrary: "",
                                isEnabled: false,
                              });
                              toast({
                                title: "SharePoint disconnected",
                                description: "SharePoint integration has been disabled.",
                              });
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditingSharePoint(true)}>
                          <Cloud className="h-4 w-4 mr-2" />
                          Configure SharePoint
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Information Panel */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">SharePoint Integration Requirements</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Azure AD application with SharePoint permissions</li>
                        <li>Sites.ReadWrite.All application permission</li>
                        <li>Admin consent for the application</li>
                        <li>Valid SharePoint site URL and document library</li>
                      </ul>
                      <p className="mt-3 font-medium">What the Test Connection does:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Generates an OAuth token using your credentials</li>
                        <li>Verifies access to your SharePoint site</li>
                        <li>Checks if the document library exists and is accessible</li>
                        <li>Confirms read/write permissions are properly configured</li>
                      </ul>
                      <p className="mt-2 text-xs">
                        <a href="#" className="text-blue-600 underline">Learn how to set up SharePoint integration</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sync Settings (when connected) */}
                {sharePointForm.isEnabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Sync Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-sync Documents</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically sync new documents to SharePoint
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Sync Frequency</Label>
                          <p className="text-sm text-muted-foreground">
                            How often to check for document changes
                          </p>
                        </div>
                        <select className="h-8 border border-gray-200 rounded-md px-2 text-sm">
                          <option value="realtime">Real-time</option>
                          <option value="5min">Every 5 minutes</option>
                          <option value="15min">Every 15 minutes</option>
                          <option value="1hour">Every hour</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Version Control</Label>
                          <p className="text-sm text-muted-foreground">
                            Keep document version history in SharePoint
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {members.length} team member{members.length !== 1 ? 's' : ''} in your organization
                    </p>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Organization Owner</p>
                          <p className="text-sm text-muted-foreground">Full access to all features</p>
                        </div>
                      </div>
                      <Badge variant="default">You</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Team Members</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.max(0, members.length - 1)} other member{Math.max(0, members.length - 1) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{Math.max(0, members.length - 1)} Users</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        )}
      </div>
    </AppLayout>
  );
}
