"use client";

import React, { useState, useEffect } from 'react';
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
import { Department, DepartmentFormData, ValidationError } from '@/types/role-department.types';
import { ValidationUtils } from '@/utils/validation.utils';
import { Loader2, AlertCircle } from 'lucide-react';

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  departments: Department[];
  department?: Department;
  loading?: boolean;
}

export function DepartmentForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  departments, 
  department, 
  loading = false 
}: DepartmentFormProps) {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    headOfDepartment: '',
    parentDepartmentId: '',
    location: '',
    budget: ''
  });
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when department prop changes
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        headOfDepartment: department.headOfDepartment || '',
        parentDepartmentId: department.parentDepartmentId || '',
        location: department.location || '',
        budget: department.budget ? department.budget.toString() : ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        headOfDepartment: '',
        parentDepartmentId: '',
        location: '',
        budget: ''
      });
    }
    setErrors([]);
  }, [department, isOpen]);

  const handleInputChange = (field: keyof DepartmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Remove field-specific errors when user starts typing
    setErrors(prev => ValidationUtils.removeFieldError(prev, field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = ValidationUtils.validateDepartmentForm(formData);
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
        message: error instanceof Error ? error.message : 'Failed to save department'
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string) => ValidationUtils.getFieldError(errors, field);
  const hasGeneralError = errors.some(err => err.field === 'general');

  // Filter out current department from parent options to prevent circular references
  const availableParentDepartments = departments.filter(dept => 
    dept.isActive && 
    dept.id !== department?.id &&
    dept.id !== department?.parentDepartmentId
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Create New Department'}
          </DialogTitle>
          <DialogDescription>
            {department 
              ? 'Update the department information and structure.' 
              : 'Create a new department with organizational details.'
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
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Engineering"
                className={getFieldError('name') ? 'border-destructive' : ''}
              />
              {getFieldError('name') && (
                <p className="text-xs text-destructive">{getFieldError('name')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headOfDepartment">Head of Department</Label>
              <Input
                id="headOfDepartment"
                value={formData.headOfDepartment}
                onChange={(e) => handleInputChange('headOfDepartment', e.target.value)}
                placeholder="e.g., John Doe"
                className={getFieldError('headOfDepartment') ? 'border-destructive' : ''}
              />
              {getFieldError('headOfDepartment') && (
                <p className="text-xs text-destructive">{getFieldError('headOfDepartment')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Describe the department's purpose and responsibilities..."
              rows={3}
              className={getFieldError('description') ? 'border-destructive' : ''}
            />
            {getFieldError('description') && (
              <p className="text-xs text-destructive">{getFieldError('description')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentDepartment">Parent Department</Label>
              <Select 
                value={formData.parentDepartmentId || "none"} 
                onValueChange={(value) => handleInputChange('parentDepartmentId', value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent Department</SelectItem>
                  {availableParentDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., New York, NY"
                className={getFieldError('location') ? 'border-destructive' : ''}
              />
              {getFieldError('location') && (
                <p className="text-xs text-destructive">{getFieldError('location')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Annual Budget</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="0"
                className={`pl-8 ${getFieldError('budget') ? 'border-destructive' : ''}`}
                min="0"
                step="1000"
              />
            </div>
            {getFieldError('budget') && (
              <p className="text-xs text-destructive">{getFieldError('budget')}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the annual budget for this department (optional)
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
              {department ? 'Update Department' : 'Create Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
