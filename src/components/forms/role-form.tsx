"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Role, RoleFormData, ValidationError, Department, Permission } from '@/types/role-department.types';
import { ValidationUtils } from '@/utils/validation.utils';
import { Loader2, AlertCircle } from 'lucide-react';

interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
  departments: Department[];
  permissions: Permission[];
  role?: Role;
  loading?: boolean;
}

export function RoleForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  departments, 
  permissions,
  role, 
  loading = false 
}: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
    level: 'user',
    departmentId: ''
  });
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when role prop changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        level: role.level,
        departmentId: role.departmentId || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        level: 'user',
        departmentId: ''
      });
    }
    setErrors([]);
  }, [role, isOpen]);

  const handleInputChange = (field: keyof RoleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Remove field-specific errors when user starts typing
    setErrors(prev => ValidationUtils.removeFieldError(prev, field));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
    
    // Remove permission errors when user makes changes
    setErrors(prev => ValidationUtils.removeFieldError(prev, 'permissions'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = ValidationUtils.validateRoleForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Handle submission errors
      setErrors([{
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to save role'
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string) => ValidationUtils.getFieldError(errors, field);
  const hasGeneralError = errors.some(err => err.field === 'general');

  const activeDepartments = departments.filter(dept => dept.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {role 
              ? 'Update the role information and permissions.' 
              : 'Create a new role with specific permissions and department assignment.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {hasGeneralError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                {getFieldError('general')}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Project Manager"
                className={getFieldError('name') ? 'border-destructive' : ''}
              />
              {getFieldError('name') && (
                <p className="text-xs text-destructive">{getFieldError('name')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Role Level *</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => handleInputChange('level', value as 'admin' | 'manager' | 'user')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {getFieldError('level') && (
                <p className="text-xs text-destructive">{getFieldError('level')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={formData.departmentId || "none"} 
              onValueChange={(value) => handleInputChange('departmentId', value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Department</SelectItem>
                {activeDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Describe the role responsibilities and scope..."
              rows={3}
              className={getFieldError('description') ? 'border-destructive' : ''}
            />
            {getFieldError('description') && (
              <p className="text-xs text-destructive">{getFieldError('description')}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Permissions *</Label>
            {getFieldError('permissions') && (
              <p className="text-xs text-destructive">{getFieldError('permissions')}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`permission-${permission.id}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {permission.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {formData.permissions.length} permission{formData.permissions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || loading}
            >
              {(isSubmitting || loading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {role ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
