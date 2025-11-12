// Shared utility functions and constants
const jwt = require('jsonwebtoken');

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
  JWT_MISSING: 'JSON Web Token not found',
  JWT_EXPIRED: 'JSON Web Token has expired',
  JWT_INVALID: 'JSON Web Token is malformed'
};

// Determine if JWT is valid.
// If JWT is valid: return the contents (json)
// If JWT is invalid: error
function validateJWT(token) {
  // If no token was received:
  if (!token) {
    return { error: ERROR_MESSAGES.JWT_MISSING };
  }

  try {
    const jwtsecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtsecret);
    return decoded; // Token was valid, return its contents.
  } catch (e) {
    // Token was expired.
    if (e.name == 'TokenExpiredError') {
      return { error: ERROR_MESSAGES.JWT_EXPIRED };
    }
    // Something else is wrong with the token.
    else {
      return { error: ERROR_MESSAGES.JWT_INVALID };
    }
    
  }
}

module.exports = {
  areInputsValid,
  isValidEmail,
  isValidObjectId,
  validateJWT,
  STUDENT,
  TEACHER,
  DB_NAME,
  USERS,
  CLASSES,
  RECORDS,
  ERROR_MESSAGES,
  ATTENDANCE_THRESHOLD
};
