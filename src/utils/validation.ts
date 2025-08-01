/**
 * Comprehensive Input Validation System
 * 
 * Provides schema-based validation for all API endpoints and forms,
 * with real-time feedback and sanitization.
 */

import { logger } from './logger';

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData?: any;
};

export type FieldValidationResult = {
  isValid: boolean;
  error?: string;
  sanitizedValue?: any;
};

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

class Validator {
  private static instance: Validator;

  private constructor() {}

  public static getInstance(): Validator {
    if (!Validator.instance) {
      Validator.instance = new Validator();
    }
    return Validator.instance;
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    return input
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: URLs (potential for XSS)
      .replace(/data:/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate a single field against a rule
   */
  public validateField(value: any, rule: ValidationRule, fieldName: string): FieldValidationResult {
    const traceId = logger.getTraceId();
    
    logger.debug('Field validation started', {
      fieldName,
      hasValue: value !== undefined && value !== null,
      ruleType: rule.type
    }, 'VALIDATION');

    try {
      // Handle required validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        return {
          isValid: false,
          error: `${fieldName} is required`
        };
      }

      // If value is empty and not required, it's valid
      if (!rule.required && (value === undefined || value === null || value === '')) {
        return {
          isValid: true,
          sanitizedValue: value
        };
      }

      let sanitizedValue = value;

      // Type validation and sanitization
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            return {
              isValid: false,
              error: `${fieldName} must be a string`
            };
          }
          sanitizedValue = this.sanitizeString(value);
          break;

        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return {
              isValid: false,
              error: `${fieldName} must be a valid number`
            };
          }
          sanitizedValue = numValue;
          break;

        case 'email':
          if (typeof value !== 'string') {
            return {
              isValid: false,
              error: `${fieldName} must be a string`
            };
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return {
              isValid: false,
              error: `${fieldName} must be a valid email address`
            };
          }
          sanitizedValue = this.sanitizeString(value.toLowerCase());
          break;

        case 'url':
          if (typeof value !== 'string') {
            return {
              isValid: false,
              error: `${fieldName} must be a string`
            };
          }
          try {
            new URL(value);
            sanitizedValue = this.sanitizeString(value);
          } catch {
            return {
              isValid: false,
              error: `${fieldName} must be a valid URL`
            };
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            return {
              isValid: false,
              error: `${fieldName} must be an array`
            };
          }
          sanitizedValue = value.map(item => 
            typeof item === 'string' ? this.sanitizeString(item) : item
          );
          break;

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value) || value === null) {
            return {
              isValid: false,
              error: `${fieldName} must be an object`
            };
          }
          // Recursively sanitize object properties
          sanitizedValue = this.sanitizeObject(value);
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            // Try to convert string representations
            if (value === 'true' || value === '1') {
              sanitizedValue = true;
            } else if (value === 'false' || value === '0') {
              sanitizedValue = false;
            } else {
              return {
                isValid: false,
                error: `${fieldName} must be a boolean`
              };
            }
          }
          break;
      }

      // Length validation for strings and arrays
      if (rule.minLength !== undefined) {
        const length = typeof sanitizedValue === 'string' ? sanitizedValue.length : 
                      Array.isArray(sanitizedValue) ? sanitizedValue.length : 0;
        if (length < rule.minLength) {
          return {
            isValid: false,
            error: `${fieldName} must be at least ${rule.minLength} characters long`
          };
        }
      }

      if (rule.maxLength !== undefined) {
        const length = typeof sanitizedValue === 'string' ? sanitizedValue.length : 
                      Array.isArray(sanitizedValue) ? sanitizedValue.length : 0;
        if (length > rule.maxLength) {
          return {
            isValid: false,
            error: `${fieldName} must be no more than ${rule.maxLength} characters long`
          };
        }
      }

      // Numeric range validation
      if (rule.min !== undefined && typeof sanitizedValue === 'number') {
        if (sanitizedValue < rule.min) {
          return {
            isValid: false,
            error: `${fieldName} must be at least ${rule.min}`
          };
        }
      }

      if (rule.max !== undefined && typeof sanitizedValue === 'number') {
        if (sanitizedValue > rule.max) {
          return {
            isValid: false,
            error: `${fieldName} must be no more than ${rule.max}`
          };
        }
      }

      // Pattern validation
      if (rule.pattern && typeof sanitizedValue === 'string') {
        if (!rule.pattern.test(sanitizedValue)) {
          return {
            isValid: false,
            error: `${fieldName} format is invalid`
          };
        }
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
        return {
          isValid: false,
          error: `${fieldName} must be one of: ${rule.allowedValues.join(', ')}`
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

      // Apply custom sanitization if provided
      if (rule.sanitize) {
        sanitizedValue = rule.sanitize(sanitizedValue);
      }

      logger.debug('Field validation completed successfully', {
        fieldName,
        originalValue: value,
        sanitizedValue
      }, 'VALIDATION');

      return {
        isValid: true,
        sanitizedValue
      };

    } catch (error) {
      logger.error('Field validation error', error as Error, {
        fieldName,
        value,
        rule
      }, 'VALIDATION');

      return {
        isValid: false,
        error: `Validation error for ${fieldName}`
      };
    }
  }

  /**
   * Sanitize an object recursively
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : 
          typeof item === 'object' && item !== null ? this.sanitizeObject(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Validate data against a schema
   */
  public validate(data: any, schema: ValidationSchema): ValidationResult {
    const traceId = logger.getTraceId();
    
    logger.debug('Schema validation started', {
      dataKeys: Object.keys(data || {}),
      schemaKeys: Object.keys(schema)
    }, 'VALIDATION');

    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};

    try {
      // Validate each field in the schema
      for (const [fieldName, rule] of Object.entries(schema)) {
        const fieldResult = this.validateField(data[fieldName], rule, fieldName);
        
        if (!fieldResult.isValid) {
          errors[fieldName] = [fieldResult.error!];
        } else {
          sanitizedData[fieldName] = fieldResult.sanitizedValue;
        }
      }

      // Check for unexpected fields but handle them gracefully
      const allowedFields = Object.keys(schema);
      const providedFields = Object.keys(data || {});
      const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
      
      if (unexpectedFields.length > 0) {
        logger.warn('Unexpected fields in validation - discarding safely', {
          unexpectedFields: unexpectedFields.slice(0, 10), // Limit logging
          allowedFieldCount: allowedFields.length,
          providedFieldCount: providedFields.length,
          context: 'GitHub API response contains additional fields'
        });
        
        // Silently discard unexpected fields - this is normal for GitHub API
        // Only log as warning, not security event, since GitHub API evolves
      }

      const isValid = Object.keys(errors).length === 0;

      logger.debug('Schema validation completed', {
        isValid,
        errorCount: Object.keys(errors).length,
        sanitizedFieldCount: Object.keys(sanitizedData).length
      }, 'VALIDATION');

      return {
        isValid,
        errors,
        sanitizedData: isValid ? sanitizedData : undefined
      };

    } catch (error) {
      logger.error('Schema validation error', error as Error, {
        schema: Object.keys(schema),
        data: data ? Object.keys(data) : null
      }, 'VALIDATION');

      return {
        isValid: false,
        errors: {
          _general: ['Validation failed due to an internal error']
        }
      };
    }
  }

  /**
   * Validate API request body
   */
  public validateApiRequest(body: any, schema: ValidationSchema, endpoint: string): ValidationResult {
    logger.apiRequestStart('VALIDATE', endpoint, {
      bodyKeys: body ? Object.keys(body) : null,
      schemaKeys: Object.keys(schema)
    });

    const startTime = performance.now();
    const result = this.validate(body, schema);
    const duration = performance.now() - startTime;

    logger.apiRequestComplete('VALIDATE', endpoint, result.isValid ? 200 : 400, duration, {
      isValid: result.isValid,
      errorCount: Object.keys(result.errors).length
    });

    if (!result.isValid) {
      logger.security('API request validation failed', 'high', {
        endpoint,
        errors: result.errors,
        body: body ? Object.keys(body) : null
      });
    }

    return result;
  }
}

// Export singleton instance
export const validator = Validator.getInstance();

// Common validation schemas
export const commonSchemas = {
  // User profile validation
  userProfile: {
    name: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-'\.]+$/
    },
    email: {
      type: 'email' as const,
      required: true,
      maxLength: 255
    },
    bio: {
      type: 'string' as const,
      required: false,
      maxLength: 500
    },
    location: {
      type: 'string' as const,
      required: false,
      maxLength: 100
    },
    website: {
      type: 'url' as const,
      required: false
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
    private: {
      type: 'boolean' as const,
      required: true
    }
  },

  // Career profile validation
  careerProfile: {
    currentRole: {
      type: 'string' as const,
      required: false,
      maxLength: 100,
      allowedValues: [
        'student', 'junior-developer', 'mid-level-developer', 
        'senior-developer', 'lead-developer', 'architect',
        'product-manager', 'designer', 'data-scientist', 'other'
      ]
    },
    targetRole: {
      type: 'string' as const,
      required: true,
      maxLength: 100,
      allowedValues: [
        'frontend-developer', 'backend-developer', 'fullstack-developer',
        'mobile-developer', 'data-scientist', 'devops-engineer',
        'product-manager', 'tech-lead', 'architect', 'other'
      ]
    },
    experienceLevel: {
      type: 'string' as const,
      required: true,
      allowedValues: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    skills: {
      type: 'array' as const,
      required: false,
      maxLength: 50
    },
    goals: {
      type: 'array' as const,
      required: false,
      maxLength: 10
    }
  },

  // API pagination validation
  pagination: {
    page: {
      type: 'number' as const,
      required: false,
      min: 1,
      max: 1000
    },
    perPage: {
      type: 'number' as const,
      required: false,
      min: 1,
      max: 100
    },
    sortBy: {
      type: 'string' as const,
      required: false,
      allowedValues: ['created', 'updated', 'name', 'stars', 'forks']
    },
    sortOrder: {
      type: 'string' as const,
      required: false,
      allowedValues: ['asc', 'desc']
    }
  }
};

// Utility functions for form validation
export const createFormValidator = (schema: ValidationSchema) => {
  return {
    validateField: (fieldName: string, value: any): FieldValidationResult => {
      const rule = schema[fieldName];
      if (!rule) {
        return { isValid: true, sanitizedValue: value };
      }
      return validator.validateField(value, rule, fieldName);
    },
    
    validateForm: (data: any): ValidationResult => {
      return validator.validate(data, schema);
    }
  };
};

export default validator;