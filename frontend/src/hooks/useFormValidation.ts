// Custom hook for form validation
import { useState, useCallback } from 'react';
import type { ValidationResult } from '../utils/validation';

interface FieldValidators {
    [fieldName: string]: (value: string | number | boolean | Record<string, boolean>) => ValidationResult;
}

interface FormErrors {
    [fieldName: string]: string;
}

interface TouchedFields {
    [fieldName: string]: boolean;
}

export function useFormValidation(validators: FieldValidators) {
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<TouchedFields>({});

    // Validate a single field
    const validateField = useCallback((fieldName: string, value: string | number | boolean | Record<string, boolean>): boolean => {
        const validator = validators[fieldName];
        if (!validator) return true;

        const result = validator(value);
        setErrors(prev => ({
            ...prev,
            [fieldName]: result.error
        }));

        return result.isValid;
    }, [validators]);

    // Validate all fields
    const validateAllFields = useCallback((formData: Record<string, string | number | boolean | Record<string, boolean>>): boolean => {
        const newErrors: FormErrors = {};
        let isFormValid = true;

        Object.keys(validators).forEach(fieldName => {
            const validator = validators[fieldName];
            const value = formData[fieldName];
            const result = validator(value);
            
            if (!result.isValid) {
                newErrors[fieldName] = result.error;
                isFormValid = false;
            }
        });

        setErrors(newErrors);
        
        // Mark all fields as touched
        const allTouched: TouchedFields = {};
        Object.keys(validators).forEach(fieldName => {
            allTouched[fieldName] = true;
        });
        setTouched(allTouched);

        return isFormValid;
    }, [validators]);

    // Handle field blur (mark as touched and validate)
    const handleBlur = useCallback((fieldName: string, value: string | number | boolean | Record<string, boolean>) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName, value);
    }, [validateField]);

    // Handle field change (validate only if already touched)
    const handleChange = useCallback((fieldName: string, value: string | number | boolean | Record<string, boolean>) => {
        if (touched[fieldName]) {
            validateField(fieldName, value);
        }
    }, [touched, validateField]);

    // Clear all errors and touched state
    const resetValidation = useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);

    // Check if field has error and is touched (should show error)
    const shouldShowError = useCallback((fieldName: string): boolean => {
        return touched[fieldName] && !!errors[fieldName];
    }, [touched, errors]);

    return {
        errors,
        touched,
        validateField,
        validateAllFields,
        handleBlur,
        handleChange,
        resetValidation,
        shouldShowError
    };
}
