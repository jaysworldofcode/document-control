"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProjectManager } from '@/types/project.types';
import { 
  User,
  UserPlus,
  Loader2
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface UserSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (manager: ProjectManager) => void;
  existingManagerIds: string[];
}

export function UserSelector({ isOpen, onClose, onSelect, existingManagerIds }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [canApproveDocuments, setCanApproveDocuments] = useState(true);
  const [isPrimaryManager, setIsPrimaryManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/list');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = users.filter(user => !existingManagerIds.includes(user.id));
  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleSelect = () => {
    if (!selectedUser) return;

    const manager: ProjectManager = {
      id: selectedUser.id,
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      canApproveDocuments,
      isPrimaryManager,
      addedAt: new Date().toISOString(),
      addedBy: 'current_user' // This would be the current user's ID
    };

    onSelect(manager);
    
    // Reset form
    setSelectedUserId("");
    setCanApproveDocuments(true);
    setIsPrimaryManager(false);
    onClose();
  };

  const handleClose = () => {
    setSelectedUserId("");
    setCanApproveDocuments(true);
    setIsPrimaryManager(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project Manager</DialogTitle>
          <DialogDescription>
            Select a user to add as a project manager.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select User</Label>
            {loading ? (
              <div className="flex items-center gap-2 p-3 border rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading users...</span>
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected User Preview */}
          {selectedUser && (
            <div className="p-3 border rounded bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Selected User</span>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedUser.name}</div>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Role:</strong> {selectedUser.role}</div>
              </div>
            </div>
          )}

          {/* Manager Permissions */}
          {selectedUser && (
            <div className="space-y-3">
              <Label>Manager Permissions</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can-approve"
                  checked={canApproveDocuments}
                  onCheckedChange={(checked) => setCanApproveDocuments(checked as boolean)}
                />
                <Label 
                  htmlFor="can-approve" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Can approve documents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-primary"
                  checked={isPrimaryManager}
                  onCheckedChange={(checked) => setIsPrimaryManager(checked as boolean)}
                />
                <Label 
                  htmlFor="is-primary" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Primary manager
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedUser}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
