// Common validation functions for form fields

export interface ValidationResult {
    isValid: boolean;
    error: string;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
    if (!email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true, error: '' };
}

// Password validation
export function validatePassword(password: string, minLength: number = 6): ValidationResult {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < minLength) {
        return { isValid: false, error: `Password must be at least ${minLength} characters` };
    }
    
    return { isValid: true, error: '' };
}

// Confirm password validation
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }
    
    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }
    
    return { isValid: true, error: '' };
}

// Name validation (first name, last name)
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    if (!name.trim()) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    if (name.trim().length < 2) {
        return { isValid: false, error: `${fieldName} must be at least 2 characters` };
    }
    
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
        return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }
    
    return { isValid: true, error: '' };
}

// ID validation (student/teacher ID like "ia654321")
export function validateUserId(id: string): ValidationResult {
    if (!id.trim()) {
        return { isValid: false, error: 'ID is required' };
    }
    
    // UCF NID format: 2 letters followed by 6 digits
    if (!/^[a-zA-Z]{2}\d{6}$/.test(id.trim())) {
        return { isValid: false, error: 'ID must be 2 letters followed by 6 digits (e.g., it654321)' };
    }
    
    return { isValid: true, error: '' };
}

// Class name validation
export function validateClassName(className: string): ValidationResult {
    if (!className.trim()) {
        return { isValid: false, error: 'Class name is required' };
    }
    
    if (className.trim().length < 3) {
        return { isValid: false, error: 'Class name must be at least 3 characters' };
    }
    
    return { isValid: true, error: '' };
}

// Class code validation (e.g., COP4331)
export function validateClassCode(classCode: string): ValidationResult {
    if (!classCode.trim()) {
        return { isValid: false, error: 'Class code is required' };
    }
    
    if (!/^[A-Z]{3}\d{4}$/i.test(classCode.trim())) {
        return { isValid: false, error: 'Class code must be 3 letters followed by 4 numbers (e.g., COP4331)' };
    }
    
    return { isValid: true, error: '' };
}

// Section validation
export function validateSection(section: string): ValidationResult {
    if (!section.trim()) {
        return { isValid: false, error: 'Section is required' };
    }
    
    return { isValid: true, error: '' };
}

// Required field validation (generic)
export function validateRequired(value: string, fieldName: string = 'This field'): ValidationResult {
    if (!value || !value.toString().trim()) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    return { isValid: true, error: '' };
}

// Time validation
export function validateTime(time: string, fieldName: string = 'Time'): ValidationResult {
    if (!time) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    return { isValid: true, error: '' };
}

// Time range validation (end time must be after start time)
export function validateTimeRange(startTime: string, endTime: string, minDuration: number = 15): ValidationResult {
    if (!startTime || !endTime) {
        return { isValid: false, error: 'Both start and end times are required' };
    }
    
    // Parse time strings (format: "HH:MM")
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Convert to total minutes
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Calculate difference
    let duration = endTotalMinutes - startTotalMinutes;
    
    // Handle case where end time is on the next day
    if (duration < 0) {
        duration += 24 * 60;
    }
    
    if (duration <= 0) {
        return { isValid: false, error: 'End time must be after start time' };
    }
    
    if (duration < minDuration) {
        return { isValid: false, error: `Duration must be at least ${minDuration} minutes` };
    }
    
    return { isValid: true, error: '' };
}

// Verification code validation (6-digit code)
export function validateVerificationCode(code: string): ValidationResult {
    if (!code) {
        return { isValid: false, error: 'Verification code is required' };
    }
    
    if (!/^\d{6}$/.test(code)) {
        return { isValid: false, error: 'Verification code must be 6 digits' };
    }
    
    return { isValid: true, error: '' };
}

// Helper function to get just the error message
export function getErrorMessage(result: ValidationResult): string {
    return result.error;
}

// Helper function to check if valid
export function isValid(result: ValidationResult): boolean {
    return result.isValid;
}
