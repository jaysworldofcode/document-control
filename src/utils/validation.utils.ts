import { ValidationError, RoleFormData, DepartmentFormData } from '@/types/role-department.types';

export class ValidationUtils {
  static validateRequired(value: string, fieldName: string): ValidationError | null {
    if (!value || value.trim().length === 0) {
      return {
        field: fieldName,
        message: `${fieldName} is required`
      };
    }
    return null;
  }

  static validateMinLength(value: string, minLength: number, fieldName: string): ValidationError | null {
    if (value && value.length < minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters long`
      };
    }
    return null;
  }

  static validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationError | null {
    if (value && value.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${maxLength} characters`
      };
    }
    return null;
  }

  static validateEmail(email: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return {
        field: 'email',
        message: 'Please enter a valid email address'
      };
    }
    return null;
  }

  static validateNumber(value: string, fieldName: string): ValidationError | null {
    if (value && isNaN(Number(value))) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid number`
      };
    }
    return null;
  }

  static validatePositiveNumber(value: string, fieldName: string): ValidationError | null {
    const num = Number(value);
    if (value && (isNaN(num) || num < 0)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a positive number`
      };
    }
    return null;
  }

  static validateRoleForm(data: RoleFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate name
    const nameRequired = this.validateRequired(data.name, 'Role name');
    if (nameRequired) errors.push(nameRequired);
    
    const nameLength = this.validateMinLength(data.name, 2, 'Role name');
    if (nameLength) errors.push(nameLength);
    
    const nameMaxLength = this.validateMaxLength(data.name, 50, 'Role name');
    if (nameMaxLength) errors.push(nameMaxLength);

    // Validate description
    const descRequired = this.validateRequired(data.description, 'Description');
    if (descRequired) errors.push(descRequired);
    
    const descLength = this.validateMinLength(data.description, 10, 'Description');
    if (descLength) errors.push(descLength);
    
    const descMaxLength = this.validateMaxLength(data.description, 500, 'Description');
    if (descMaxLength) errors.push(descMaxLength);

    // Validate permissions
    if (!data.permissions || data.permissions.length === 0) {
      errors.push({
        field: 'permissions',
        message: 'At least one permission must be selected'
      });
    }

    return errors;
  }

  static validateDepartmentForm(data: DepartmentFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate name
    const nameRequired = this.validateRequired(data.name, 'Department name');
    if (nameRequired) errors.push(nameRequired);
    
    const nameLength = this.validateMinLength(data.name, 2, 'Department name');
    if (nameLength) errors.push(nameLength);
    
    const nameMaxLength = this.validateMaxLength(data.name, 50, 'Department name');
    if (nameMaxLength) errors.push(nameMaxLength);

    // Validate description
    const descRequired = this.validateRequired(data.description, 'Description');
    if (descRequired) errors.push(descRequired);
    
    const descLength = this.validateMinLength(data.description, 10, 'Description');
    if (descLength) errors.push(descLength);
    
    const descMaxLength = this.validateMaxLength(data.description, 500, 'Description');
    if (descMaxLength) errors.push(descMaxLength);

    // Validate budget if provided
    if (data.budget) {
      const budgetNumber = this.validatePositiveNumber(data.budget, 'Budget');
      if (budgetNumber) errors.push(budgetNumber);
    }

    return errors;
  }

  static getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
    const error = errors.find(err => err.field === fieldName);
    return error?.message;
  }

  static hasErrors(errors: ValidationError[]): boolean {
    return errors.length > 0;
  }

  static removeFieldError(errors: ValidationError[], fieldName: string): ValidationError[] {
    return errors.filter(err => err.field !== fieldName);
  }
}
