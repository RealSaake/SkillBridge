/**
 * MANDATORY INPUT VALIDATION & SANITIZATION
 * 
 * STRICT REQUIREMENTS:
 * - NO data reaches business logic without validation
 * - ALL inputs must be sanitized
 * - Real-time validation feedback
 * - Schema-based validation for API endpoints
 * - Clear error messages per field
 */

import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData?: any;
  errorId?: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: any;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'url' | 'array' | 'object' | 'boolean';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  sanitize?: (value: any) => any;
  allowedValues?: any[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

class InputValidator {
  private static instance: InputValidator;

  private constructor() {}

  public static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate and sanitize data against schema
   */
  public validate(data: any, schema: ValidationSchema, context?: string): ValidationResult {
    const traceId = logger.getTraceId();
    const errors: Record<string, string[]> = {};
    const sanitizedData: any = {};
    let isValid = true;

    logger.debug('Starting input validation', {
      context: context || 'unknown',
      fieldsToValidate: Object.keys(schema),
      dataKeys: Object.keys(data || {})
    }, 'InputValidator');

    try {
      // Validate each field in schema
      for (const [fieldName, rule] of Object.entries(schema)) {
        const fieldResult = this.validateField(fieldName, data?.[fieldName], rule);
        
        if (!fieldResult.isValid && fieldResult.error) {
          errors[fieldName] = [fieldResult.error];
          isValid = false;
        } else if (fieldResult.sanitizedValue !== undefined) {
          sanitizedData[fieldName] = fieldResult.sanitizedValue;
        }
      }

      // Check for unexpected fields (potential security issue)
      if (data && typeof data === 'object') {
        const unexpectedFields = Object.keys(data).filter(key => !schema[key]);
        if (unexpectedFields.length > 0) {
          logger.security('Unexpected fields in input data', 'medium', {
            unexpectedFields,
            context: context || 'unknown',
            allFields: Object.keys(data)
          }, 'InputValidator');
        }
      }

      const result: ValidationResult = {
        isValid,
        errors,
        sanitizedData: isValid ? sanitizedData : undefined
      };

      if (!isValid) {
        const errorId = `VAL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        result.errorId = errorId;

        logger.warn('Input validation failed', {
          errorId,
          context: context || 'unknown',
          errors,
          fieldCount: Object.keys(errors).length
        }, 'InputValidator');
      } else {
        logger.debug('Input validation successful', {
          context: context || 'unknown',
          fieldsValidated: Object.keys(sanitizedData).length
        }, 'InputValidator');
      }

      return result;

    } catch (error) {
      const errorId = `VAL_ERR_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      logger.error('Input validation system error', error as Error, {
        errorId,
        context: context || 'unknown',
        schema: Object.keys(schema)
      }, 'InputValidator');

      return {
        isValid: false,
        errors: { _system: ['Validation system error occurred'] },
        errorId
      };
    }
  }

  /**
   * Validate individual field
   */
  public validateField(fieldName: string, value: any, rule: ValidationRule): FieldValidationResult {
    try {
      // Handle required validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        return {
          isValid: false,
          error: `${this.formatFieldName(fieldName)} is required`
        };
      }

      // If not required and empty, return valid with undefined
      if (!rule.required && (value === undefined || value === null || value === '')) {
        return {
          isValid: true,
          sanitizedValue: undefined
        };
      }

      // Sanitize value first
      let sanitizedValue = rule.sanitize ? rule.sanitize(value) : this.defaultSanitize(value, rule.type);

      // Type validation
      if (rule.type) {
        const typeResult = this.validateType(sanitizedValue, rule.type, fieldName);
        if (!typeResult.isValid) {
          return typeResult;
        }
        sanitizedValue = typeResult.sanitizedValue;
      }

      // Length validation for strings
      if (rule.type === 'string' && typeof sanitizedValue === 'string') {
        if (rule.minLength && sanitizedValue.length < rule.minLength) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be at least ${rule.minLength} characters`
          };
        }
        if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be no more than ${rule.maxLength} characters`
          };
        }
      }

      // Numeric range validation
      if (rule.type === 'number' && typeof sanitizedValue === 'number') {
        if (rule.min !== undefined && sanitizedValue < rule.min) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be at least ${rule.min}`
          };
        }
        if (rule.max !== undefined && sanitizedValue > rule.max) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be no more than ${rule.max}`
          };
        }
      }

      // Pattern validation
      if (rule.pattern && typeof sanitizedValue === 'string') {
        if (!rule.pattern.test(sanitizedValue)) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} format is invalid`
          };
        }
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
        return {
          isValid: false,
          error: `${this.formatFieldName(fieldName)} must be one of: ${rule.allowedValues.join(', ')}`
        };
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(sanitizedValue);
        if (customError) {
          return {
            isValid: false,
            error: customError
          };
        }
      }

      return {
        isValid: true,
        sanitizedValue
      };

    } catch (error) {
      logger.error('Field validation error', error as Error, {
        fieldName,
        rule: JSON.stringify(rule)
      }, 'InputValidator');

      return {
        isValid: false,
        error: `${this.formatFieldName(fieldName)} validation failed`
      };
    }
  }

  /**
   * Validate type and convert if necessary
   */
  private validateType(value: any, type: string, fieldName: string): FieldValidationResult {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be a string`
          };
        }
        return { isValid: true, sanitizedValue: value.trim() };

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be a valid number`
          };
        }
        return { isValid: true, sanitizedValue: num };

      case 'email':
        if (typeof value !== 'string') {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be a string`
          };
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const email = value.trim().toLowerCase();
        if (!emailPattern.test(email)) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be a valid email address`
          };
        }
        return { isValid: true, sanitizedValue: email };

      case 'url':
        if (typeof value !== 'string') {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be a string`
          };
        }
        try {
          const url = new URL(value.trim());
          return { isValid: true, sanitizedValue: url.toString() };
        } catch {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be a valid URL`
          };
        }

      case 'boolean':
        if (typeof value === 'boolean') {
          return { isValid: true, sanitizedValue: value };
        }
        if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          if (lower === 'true' || lower === '1' || lower === 'yes') {
            return { isValid: true, sanitizedValue: true };
          }
          if (lower === 'false' || lower === '0' || lower === 'no') {
            return { isValid: true, sanitizedValue: false };
          }
        }
        return {
          isValid: false,
          error: `${this.formatFieldName(fieldName)} must be true or false`
        };

      case 'array':
        if (!Array.isArray(value)) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be an array`
          };
        }
        return { isValid: true, sanitizedValue: value };

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return {
            isValid: false,
            error: `${this.formatFieldName(fieldName)} must be an object`
          };
        }
        return { isValid: true, sanitizedValue: value };

      default:
        return { isValid: true, sanitizedValue: value };
    }
  }

  /**
   * Default sanitization based on type
   */
  private defaultSanitize(value: any, type?: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (type) {
      case 'string':
        return typeof value === 'string' ? value.trim() : String(value).trim();
      case 'email':
        return typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
      default:
        return value;
    }
  }

  /**
   * Format field name for user-friendly error messages
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }
}

// Common validation schemas
export const commonSchemas = {
  // User profile validation
  userProfile: {
    name: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-'\.]+$/,
      sanitize: (value: string) => value.trim().replace(/\s+/g, ' ')
    },
    email: {
      type: 'email' as const,
      required: true,
      maxLength: 255
    },
    bio: {
      type: 'string' as const,
      required: false,
      maxLength: 500,
      sanitize: (value: string) => value.trim()
    },
    currentRole: {
      type: 'string' as const,
      required: false,
      maxLength: 100,
      allowedValues: ['frontend', 'backend', 'fullstack', 'data-science', 'devops', 'mobile', 'other']
    },
    targetRole: {
      type: 'string' as const,
      required: false,
      maxLength: 100,
      allowedValues: ['frontend', 'backend', 'fullstack', 'data-science', 'devops', 'mobile', 'other']
    },
    experienceLevel: {
      type: 'string' as const,
      required: false,
      allowedValues: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  },

  // GitHub repository validation
  githubRepo: {
    name: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\-_.]+$/
    },
    description: {
      type: 'string' as const,
      required: false,
      maxLength: 500
    },
    language: {
      type: 'string' as const,
      required: false,
      maxLength: 50
    },
    stars: {
      type: 'number' as const,
      required: false,
      min: 0
    },
    forks: {
      type: 'number' as const,
      required: false,
      min: 0
    }
  },

  // API request validation
  apiRequest: {
    method: {
      type: 'string' as const,
      required: true,
      allowedValues: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    url: {
      type: 'url' as const,
      required: true
    },
    headers: {
      type: 'object' as const,
      required: false
    },
    body: {
      type: 'object' as const,
      required: false
    }
  },

  // Form input validation
  contactForm: {
    name: {
      type: 'string' as const,
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s\-'\.]+$/
    },
    email: {
      type: 'email' as const,
      required: true
    },
    message: {
      type: 'string' as const,
      required: true,
      minLength: 10,
      maxLength: 1000
    }
  }
};

// Export singleton instance
export const inputValidator = InputValidator.getInstance();

// Utility functions for React forms
export const createFormValidator = (schema: ValidationSchema) => {
  return {
    validateField: (fieldName: string, value: any): FieldValidationResult => {
      const rule = schema[fieldName];
      if (!rule) {
        return { isValid: true, sanitizedValue: value };
      }
      return inputValidator.validateField(fieldName, value, rule);
    },
    
    validateForm: (data: any): ValidationResult => {
      return inputValidator.validate(data, schema, 'form');
    },
    
    sanitizeField: (fieldName: string, value: any): any => {
      const rule = schema[fieldName];
      if (!rule) return value;
      
      const result = inputValidator.validateField(fieldName, value, rule);
      return result.sanitizedValue !== undefined ? result.sanitizedValue : value;
    }
  };
};

export default inputValidator;