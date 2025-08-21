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
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                  <span className="text-sm text-muted-foreground">Not Connected</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Cloud className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Connect to SharePoint</h3>
                  <p className="text-muted-foreground mb-4">
                    Sync your documents with Microsoft SharePoint for better collaboration and storage.
                  </p>
                  <Button>
                    <Cloud className="h-4 w-4 mr-2" />
                    Setup SharePoint Integration
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">SharePoint Integration Benefits</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Automatic document synchronization</li>
                        <li>Version control and backup</li>
                        <li>Collaborative editing capabilities</li>
                        <li>Enterprise-grade security</li>
                      </ul>
                    </div>
                  </div>
                </div>
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
