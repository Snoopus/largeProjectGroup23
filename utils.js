// Shared utility functions and constants

// Helper function to validate inputs
// Returns true if all provided values are valid (not null, undefined, or empty string)
function areInputsValid(...values) {
  return values.every(value => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });
}

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate ObjectId format
function isValidObjectId(id, ObjectId) {
  return ObjectId.isValid(id);
}

// Constants
const STUDENT = 'student';
const TEACHER = 'teacher';

// Database constants
const DB_NAME = 'Project';
const USERS = 'Users';
const CLASSES = 'Classes';
const RECORDS = 'Records';

const ATTENDANCE_THRESHOLD = 0.6; // 60% attendance required

// Error messages
const ERROR_MESSAGES = {
  INVALID_FIELDS: 'Invalid or missing fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized access',
  EMAIL_EXISTS: 'Email already exists',
  USER_ID_EXISTS: 'User ID already exists',
  INSTRUCTOR_NOT_FOUND: 'Instructor not found',
  CLASS_EXISTS: 'Class with this code and section already exists',
  CLASS_NOT_FOUND: 'Class not found',
  USER_NOT_FOUND: 'User not found',
  STUDENTS_ONLY: 'Only students can join classes',
  ALREADY_IN_CLASS: 'User already enrolled in this class',
  INSTRUCTOR_ONLY: 'Only the instructor can perform this action',
  INVALID_SECRET: 'Invalid or expired code',
  NOT_IN_CLASS: 'User not enrolled in this class',
  SERVER_ERROR: 'An error occurred. Please try again later',
  ATTENDANCE_ACTIVE: 'An attendance session is already active',
  ATTENDANCE_INACTIVE: 'No active attendance session to end',
  SECRET_ACTIVE: 'A secret session is already active',
  SECRET_INACTIVE: 'No active secret session to end',
  INVALID_ROLE: 'Invalid role. Must be student or teacher',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_OBJECT_ID: 'Invalid class ID format',
  JWT_EXPIRED: 'JSON Web Token has expired',
  JWT_INVALID: 'JSON Web Token is invalid'
};

module.exports = {
  areInputsValid,
  isValidEmail,
  isValidObjectId,
  STUDENT,
  TEACHER,
  DB_NAME,
  USERS,
  CLASSES,
  RECORDS,
  ERROR_MESSAGES,
  ATTENDANCE_THRESHOLD
};
