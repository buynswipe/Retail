// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation for 10-digit Indian phone numbers
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// PIN code validation
export function isValidPinCode(pinCode: string): boolean {
  // Indian PIN codes are 6 digits
  const pinCodeRegex = /^\d{6}$/
  return pinCodeRegex.test(pinCode)
}

// GST number validation
export function isValidGSTNumber(gstNumber: string): boolean {
  // Basic GST format validation
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstRegex.test(gstNumber)
}

// Bank account number validation
export function isValidBankAccountNumber(accountNumber: string): boolean {
  // Basic validation for bank account numbers (9-18 digits)
  const accountRegex = /^\d{9,18}$/
  return accountRegex.test(accountNumber)
}

// IFSC code validation
export function isValidIFSC(ifsc: string): boolean {
  // IFSC format: First 4 characters are alphabets (bank code), 5th is 0 (reserved), and last 6 are alphanumeric (branch code)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

// Password strength validation
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Business name validation
export function isValidBusinessName(name: string): boolean {
  // At least 3 characters, alphanumeric with spaces and common punctuation
  return name.trim().length >= 3
}

// Name validation
export function isValidName(name: string): boolean {
  // At least 2 characters, alphabets with spaces
  const nameRegex = /^[A-Za-z\s]{2,}$/
  return nameRegex.test(name.trim())
}

// OTP validation
export function isValidOTP(otp: string): boolean {
  // 6-digit OTP
  const otpRegex = /^\d{6}$/
  return otpRegex.test(otp)
}
