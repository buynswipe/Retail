import { z } from "zod"

// Common validation schemas
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must not exceed 15 digits")
  .regex(/^\d+$/, "Phone number must contain only digits")

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(5, "Email must be at least 5 characters")
  .max(100, "Email must not exceed 100 characters")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must not exceed 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")

export const businessNameSchema = z
  .string()
  .min(2, "Business name must be at least 2 characters")
  .max(100, "Business name must not exceed 100 characters")

export const gstNumberSchema = z
  .string()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format")
  .optional()
  .or(z.literal(""))

export const pinCodeSchema = z.string().regex(/^[0-9]{6}$/, "PIN code must be 6 digits")
