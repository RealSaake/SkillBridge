/**
 * SIMPLIFIED FORM VALIDATION HOOK
 * 
 * Provides basic form validation functionality
 */

import { useState, useCallback } from 'react';
import { inputValidator, ValidationSchema } from '../utils/inputValidation';
import { logger } from '../utils/logger';

interface UseFormValidationReturn {
  values: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  setValue: (field: string, value: any) => void;
  setError: (field: string, error: string) => void;
  validateForm: () => boolean;
  handleSubmit: (onSubmit: (data: any) => Promise<void>) => (event: React.FormEvent) => Promise<void>;
}

export const useFormValidation = (
  schema: ValidationSchema,
  initialValues: Record<string, any> = {}
): UseFormValidationReturn => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const result = inputValidator.validate(values, schema, 'form');
    
    if (!result.isValid) {
      const newErrors: Record<string, string> = {};
      Object.entries(result.errors).forEach(([field, fieldErrors]) => {
        if (fieldErrors.length > 0) {
          newErrors[field] = fieldErrors[0];
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [values, schema]);

  const handleSubmit = useCallback((onSubmit: (data: any) => Promise<void>) => {
    return async (event: React.FormEvent) => {
      event.preventDefault();
      
      if (!validateForm()) {
        logger.warn('Form validation failed', { errors }, 'useFormValidation');
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
        logger.info('Form submitted successfully', { fieldCount: Object.keys(values).length }, 'useFormValidation');
      } catch (error) {
        logger.error('Form submission failed', error as Error, { values }, 'useFormValidation');
        setError('_form', 'An error occurred while submitting the form');
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [validateForm, values, errors]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setError,
    validateForm,
    handleSubmit
  };
};

export default useFormValidation;