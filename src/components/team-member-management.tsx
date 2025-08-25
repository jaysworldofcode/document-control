"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus,
  UserX,
  MoreHorizontal,
  UserCheck,
  Mail,
  Users,
  Loader2,
  AlertCircle,
  Crown,
  Trash2
} from "lucide-react";
import { Project } from "@/types/project.types";

interface TeamMemberManagementProps {
  project: Project;
  onUpdateTeam: (members: string[], memberIds: string[]) => Promise<void>;
  onUpdateManager: (manager: string, managerId: string) => Promise<void>;
  loading?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isManager?: boolean;
  canApproveDocuments?: boolean;
  isPrimaryManager?: boolean;
  addedAt?: string;
  teamMemberId?: string; // The project_team record ID
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export function TeamMemberManagement({ 
  project, 
  onUpdateTeam, 
  onUpdateManager, 
  loading = false 
}: TeamMemberManagementProps) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("team member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // State for team members and available users
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch team members on component mount
  useEffect(() => {
    fetchTeamMembers();
  }, [project.id]);

  // Fetch available users when add member dialog opens
  useEffect(() => {
    if (isAddMemberOpen) {
      fetchAvailableUsers();
    }
  }, [isAddMemberOpen]);

  const fetchTeamMembers = async () => {
    try {
      setIsLoadingTeam(true);
      const response = await fetch(`/api/team?projectId=${project.id}`);
      if (response.ok) {
        const members = await response.json();
        setTeamMembers(members);
      } else {
        console.error('Failed to fetch team members');
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch('/api/users/list');
      if (response.ok) {
        const users = await response.json();
        // Validate that users is an array and has the expected structure
        if (Array.isArray(users)) {
          // Filter out users who are already team members or managers
          const existingMemberIds = [
            ...teamMembers.map(m => m.id),
            ...project.managers.map(m => m.id)
          ];
          const filtered = users.filter((user: any) => 
            user && 
            user.id && 
            !existingMemberIds.includes(user.id) &&
            user.first_name &&
            user.last_name
          );
          setAvailableUsers(filtered);
        } else {
          console.error('Invalid users data structure:', users);
          setAvailableUsers([]);
        }
      } else {
        console.error('Failed to fetch available users');
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Managers as team members for display
  const managers: TeamMember[] = project.managers.map(manager => ({
    id: manager.id,
    name: manager.name,
    email: manager.email,
    role: manager.role || 'Project Manager',
    isManager: true,
    canApproveDocuments: manager.canApproveDocuments,
    isPrimaryManager: manager.isPrimaryManager,
    addedAt: manager.addedAt
  }));

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setErrors(['Please select a user to add']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          userId: selectedUserId,
          role: selectedRole
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
      }

      const newMember = await response.json();
      
      // Add the new member to local state
      setTeamMembers(prev => [...prev, newMember]);
      
      // Close the modal and reset form
      setIsAddMemberOpen(false);
      setSelectedUserId("");
      setSelectedRole("team member");
      
      // Refresh available users list
      fetchAvailableUsers();
    } catch (error) {
      console.error('Error adding team member:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to add team member']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    setMemberToRemove(member);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/team?projectId=${project.id}&userId=${memberToRemove.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team member');
      }

      // Remove the member from local state
      setTeamMembers(prev => prev.filter(member => member.id !== memberToRemove.id));
      
      // Refresh available users list if add dialog is open
      if (isAddMemberOpen) {
        fetchAvailableUsers();
      }

      // Close the dialog and reset state
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing team member:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to remove team member']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Messages */}
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

      {/* Project Managers */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center">
              Project Managers
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{manager.name}</p>
                      {manager.isPrimaryManager && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {manager.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{manager.role}</Badge>
                  {manager.canApproveDocuments && (
                    <Badge variant="outline" className="text-xs">Can Approve</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription>
                Manage project team members and their access
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddMemberOpen(true)}
              disabled={loading || isSubmitting || isLoadingTeam}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTeam ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-4 w-[130px]" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[220px]" />
                  <Skeleton className="h-4 w-[170px]" />
                </div>
              </div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members added yet</h3>
              <p className="text-muted-foreground mb-4">
                Add team members to collaborate on this project
              </p>
              <Button onClick={() => setIsAddMemberOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{member.role}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          disabled={loading || isSubmitting}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user to add to the project team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Team Member</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team member..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      No users available to add
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col items-start">
                          <span>{user.first_name} {user.last_name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team member">Team Member</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="qa engineer">QA Engineer</SelectItem>
                  <SelectItem value="business analyst">Business Analyst</SelectItem>
                  <SelectItem value="technical writer">Technical Writer</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {selectedUserId && (
              <Card>
                <CardContent className="pt-4">
                  {(() => {
                    const selectedUser = availableUsers.find(u => u.id === selectedUserId);
                    return selectedUser ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {selectedUser.first_name?.[0] || ''}{selectedUser.last_name?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                          <p className="text-sm text-muted-foreground">{selectedUser.role}</p>
                          <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsAddMemberOpen(false);
                setSelectedUserId("");
                setSelectedRole("team member");
                setErrors([]);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={isSubmitting || !selectedUserId}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Modal */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this team member from the project?
            </DialogDescription>
          </DialogHeader>

          {memberToRemove && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {memberToRemove.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{memberToRemove.name}</p>
                  <p className="text-sm text-muted-foreground">{memberToRemove.email}</p>
                  <p className="text-xs text-muted-foreground">{memberToRemove.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                This action cannot be undone. The team member will lose access to this project.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsRemoveDialogOpen(false);
                setMemberToRemove(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
