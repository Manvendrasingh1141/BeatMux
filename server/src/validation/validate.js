import mongoose from 'mongoose';

// Generic field validator
const validateField = (value, rules, fieldName) => {
  const errors = [];

  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors; // stop here if required fails
  }

  // Skip further validation if value is not provided and not required
  if (value === undefined || value === null) return errors;

  if (rules.isEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) errors.push(`${fieldName} must be a valid email`);
  }

  if (rules.isObjectId) {
    if (!mongoose.Types.ObjectId.isValid(value)) errors.push(`${fieldName} must be a valid ID`);
  }

  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength)
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    if (rules.maxLength !== undefined && value.length > rules.maxLength)
      errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
    if (rules.pattern && !rules.pattern.test(value))
      errors.push(`${fieldName} contains invalid characters`);
  }

  if (typeof value === 'number') {
    if (isNaN(value)) errors.push(`${fieldName} must be a number`);
    if (rules.min !== undefined && value < rules.min)
      errors.push(`${fieldName} must be at least ${rules.min}`);
    if (rules.max !== undefined && value > rules.max)
      errors.push(`${fieldName} must be at most ${rules.max}`);
  }

  if (rules.allowed && !rules.allowed.includes(value)) {
    errors.push(`${fieldName} has an invalid value`);
  }

  return errors;
};

// Validate a body object against a schema
export const validate = (schema) => (req, res, next) => {
  const errors = {};
  const body = req.body;

  for (const [field, rules] of Object.entries(schema)) {
    const fieldErrors = validateField(body[field], rules, field);
    if (fieldErrors.length > 0) errors[field] = fieldErrors;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors
    });
  }

  next();
};

// Validate WebSocket payload against a schema (returns null or error string)
export const validateWsPayload = (payload, schema) => {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const fieldErrors = validateField(payload?.[field], rules, field);
    if (fieldErrors.length > 0) errors[field] = fieldErrors;
  }
  return Object.keys(errors).length > 0 ? errors : null;
};
