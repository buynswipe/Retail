// Validation types
export enum ValidationRule {
  REQUIRED = "required",
  MIN_LENGTH = "minLength",
  MAX_LENGTH = "maxLength",
  PATTERN = "pattern",
  EMAIL = "email",
  PHONE = "phone",
  NUMBER = "number",
  MIN_VALUE = "minValue",
  MAX_VALUE = "maxValue",
  MATCH = "match",
}

// Validation error
export interface ValidationError {
  field: string
  rule: ValidationRule
  message: string
}

// Validation options
export interface ValidationOptions {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  number?: boolean
  minValue?: number
  maxValue?: number
  match?: string
  customValidator?: (value: any) => boolean | string
}

// Validate a single field
export function validateField(field: string, value: any, options: ValidationOptions): ValidationError | null {
  // Required check
  if (options.required && (value === undefined || value === null || value === "")) {
    return {
      field,
      rule: ValidationRule.REQUIRED,
      message: `${field} is required`,
    }
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === "") {
    return null
  }

  // String validations
  if (typeof value === "string") {
    // Min length
    if (options.minLength !== undefined && value.length < options.minLength) {
      return {
        field,
        rule: ValidationRule.MIN_LENGTH,
        message: `${field} must be at least ${options.minLength} characters`,
      }
    }

    // Max length
    if (options.maxLength !== undefined && value.length > options.maxLength) {
      return {
        field,
        rule: ValidationRule.MAX_LENGTH,
        message: `${field} must be at most ${options.maxLength} characters`,
      }
    }

    // Pattern
    if (options.pattern && !options.pattern.test(value)) {
      return {
        field,
        rule: ValidationRule.PATTERN,
        message: `${field} has an invalid format`,
      }
    }

    // Email
    if (options.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return {
        field,
        rule: ValidationRule.EMAIL,
        message: `${field} must be a valid email address`,
      }
    }

    // Phone
    if (options.phone && !/^\d{10}$/.test(value)) {
      return {
        field,
        rule: ValidationRule.PHONE,
        message: `${field} must be a valid 10-digit phone number`,
      }
    }
  }

  // Number validations
  if (options.number) {
    const num = Number(value)
    if (isNaN(num)) {
      return {
        field,
        rule: ValidationRule.NUMBER,
        message: `${field} must be a valid number`,
      }
    }

    // Min value
    if (options.minValue !== undefined && num < options.minValue) {
      return {
        field,
        rule: ValidationRule.MIN_VALUE,
        message: `${field} must be at least ${options.minValue}`,
      }
    }

    // Max value
    if (options.maxValue !== undefined && num > options.maxValue) {
      return {
        field,
        rule: ValidationRule.MAX_VALUE,
        message: `${field} must be at most ${options.maxValue}`,
      }
    }
  }

  // Custom validator
  if (options.customValidator) {
    const result = options.customValidator(value)
    if (result !== true) {
      return {
        field,
        rule: ValidationRule.PATTERN,
        message: typeof result === "string" ? result : `${field} is invalid`,
      }
    }
  }

  return null
}

// Validate an object against a schema
export function validateObject(obj: Record<string, any>, schema: Record<string, ValidationOptions>): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [field, options] of Object.entries(schema)) {
    const error = validateField(field, obj[field], options)
    if (error) {
      errors.push(error)
    }
  }

  return errors
}

// Format validation errors into a user-friendly object
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  return errors.reduce(
    (acc, error) => {
      acc[error.field] = error.message
      return acc
    },
    {} as Record<string, string>,
  )
}

// Common validation schemas
export const validationSchemas = {
  login: {
    phone: { required: true, phone: true },
    otp: { required: true, minLength: 6, maxLength: 6, pattern: /^\d{6}$/ },
  },
  signup: {
    phone: { required: true, phone: true },
    role: { required: true },
    name: { required: true, minLength: 2, maxLength: 50 },
    business_name: { minLength: 2, maxLength: 100 },
    pin_code: { required: true, pattern: /^\d{6}$/ },
  },
  product: {
    name: { required: true, minLength: 2, maxLength: 100 },
    price: { required: true, number: true, minValue: 0 },
    stock_quantity: { required: true, number: true, minValue: 0 },
    description: { maxLength: 500 },
    category: { maxLength: 50 },
    hsn_code: { maxLength: 20 },
    gst_rate: { number: true, minValue: 0, maxValue: 28 },
  },
  order: {
    payment_method: { required: true },
  },
  payment: {
    amount: { required: true, number: true, minValue: 0 },
    payment_method: { required: true },
  },
  profile: {
    name: { minLength: 2, maxLength: 50 },
    business_name: { minLength: 2, maxLength: 100 },
    pin_code: { pattern: /^\d{6}$/ },
    gst_number: { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/ },
    bank_account_number: { minLength: 9, maxLength: 18, pattern: /^\d+$/ },
    bank_ifsc: { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
  },
}
