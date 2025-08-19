"use client";

import React, { useState } from 'react';
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
}

// Mock user data for team member selection
const AVAILABLE_USERS: TeamMember[] = [
  { id: 'user_005', name: 'Alex Thompson', email: 'alex.thompson@techcorp.com', role: 'Senior Developer' },
  { id: 'user_006', name: 'Maria Garcia', email: 'maria.garcia@techcorp.com', role: 'UX Designer' },
  { id: 'user_007', name: 'Robert Chen', email: 'robert.chen@techcorp.com', role: 'QA Engineer' },
  { id: 'user_008', name: 'Lisa Wang', email: 'lisa.wang@techcorp.com', role: 'Business Analyst' },
  { id: 'user_009', name: 'James Wilson', email: 'james.wilson@techcorp.com', role: 'DevOps Engineer' },
  { id: 'user_010', name: 'Sarah Kim', email: 'sarah.kim@techcorp.com', role: 'Technical Writer' },
  { id: 'user_011', name: 'Michael Brown', email: 'michael.brown@techcorp.com', role: 'Security Specialist' },
  { id: 'user_012', name: 'Jennifer Davis', email: 'jennifer.davis@techcorp.com', role: 'Project Coordinator' },
];

export function TeamMemberManagement({ 
  project, 
  onUpdateTeam, 
  onUpdateManager, 
  loading = false 
}: TeamMemberManagementProps) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Convert project team to detailed members (mock implementation)
  const currentMembers: TeamMember[] = project.team.map((name, index) => ({
    id: project.teamIds?.[index] || `temp_${index}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@techcorp.com`,
    role: 'Team Member',
    isManager: project.managers.some(manager => manager.name === name)
  }));

  // Managers as team members
  const managers: TeamMember[] = project.managers.map(manager => ({
    id: manager.id,
    name: manager.name,
    email: manager.email,
    role: manager.role,
    isManager: true,
    canApproveDocuments: manager.canApproveDocuments,
    isPrimaryManager: manager.isPrimaryManager
  }));

  // Available users excluding current team members and managers
  const availableUsers = AVAILABLE_USERS.filter(user => 
    !currentMembers.some(member => member.id === user.id) &&
    !managers.some(manager => manager.id === user.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setErrors(['Please select a team member']);
      return;
    }

    const selectedUser = AVAILABLE_USERS.find(user => user.id === selectedUserId);
    if (!selectedUser) {
      setErrors(['Selected user not found']);
      return;
    }

    setIsSubmitting(true);
    try {
      const newMembers = [...project.team, selectedUser.name];
      const newMemberIds = [...(project.teamIds || []), selectedUser.id];
      
      await onUpdateTeam(newMembers, newMemberIds);
      
      setSelectedUserId("");
      setIsAddMemberOpen(false);
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to add team member. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberIndex: number) => {
    if (currentMembers[memberIndex]?.isManager) {
      setErrors(['Cannot remove the project manager from the team']);
      return;
    }

    setIsSubmitting(true);
    try {
      const newMembers = project.team.filter((_, index) => index !== memberIndex);
      const newMemberIds = (project.teamIds || []).filter((_, index) => index !== memberIndex);
      
      await onUpdateTeam(newMembers, newMemberIds);
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to remove team member. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeManager = async (newManagerId: string) => {
    const newManager = AVAILABLE_USERS.find(user => user.id === newManagerId) ||
                      currentMembers.find(member => member.id === newManagerId);
    
    if (!newManager) {
      setErrors(['Selected manager not found']);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateManager(newManager.name, newManager.id);
      setErrors([]);
    } catch (error) {
      setErrors(['Failed to change project manager. Please try again.']);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Project Managers
              </CardTitle>
              <CardDescription>
                People responsible for managing this project
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading || isSubmitting}>
                  Manage Managers
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Add New Manager</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currentMembers.filter(member => !member.isManager).map((member) => (
                  <DropdownMenuItem 
                    key={member.id}
                    onClick={() => handleChangeManager(member.id)}
                  >
                    {member.name}
                  </DropdownMenuItem>
                ))}
                {availableUsers.map((user) => (
                  <DropdownMenuItem 
                    key={user.id}
                    onClick={() => handleChangeManager(user.id)}
                  >
                    {user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{manager.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {manager.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {manager.isPrimaryManager && (
                    <Badge variant="default">Primary Manager</Badge>
                  )}
                  {manager.canApproveDocuments && (
                    <Badge variant="outline">Can Approve</Badge>
                  )}
                  {!manager.isPrimaryManager && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Handle removing secondary manager
                        console.log('Remove manager:', manager.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({currentMembers.filter(m => !m.isManager).length})
              </CardTitle>
              <CardDescription>
                Manage project team members and their access
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddMemberOpen(true)}
              disabled={loading || isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMembers.filter(member => !member.isManager).map((member, index) => (
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
                      <DropdownMenuItem onClick={() => handleChangeManager(member.id)}>
                        <Crown className="h-4 w-4 mr-2" />
                        Make Manager
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMember(index)}
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

            {currentMembers.filter(m => !m.isManager).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No team members added yet</p>
                <p className="text-sm">Add team members to collaborate on this project</p>
              </div>
            )}
          </div>
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
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col items-start">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <Card>
                <CardContent className="pt-4">
                  {(() => {
                    const selectedUser = availableUsers.find(u => u.id === selectedUserId);
                    return selectedUser ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {selectedUser.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{selectedUser.name}</p>
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
    </div>
  );
}
