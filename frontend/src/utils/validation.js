/**
 * Core validation utilities for SmartCity Connect
 * Acts as the first line of defense before data hits the FastAPI backend.
 */

export const validateEmail = (email) => {
  // Standard strict regex for official email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Identification (Email) is required.' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email protocol format.' };
  }
  
  return { isValid: true, error: null };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Passcode is required.' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Passcode must be at least 8 characters long.' };
  }
  
  // Optional: Enforce at least one number for Vault-level security
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return { isValid: false, error: 'Passcode must contain at least one numeric digit.' };
  }

  return { isValid: true, error: null };
};

export const validateReportPayload = (formData) => {
  const errors = {};

  if (!formData.title || formData.title.trim() === '') {
    errors.title = 'Issue title cannot be empty.';
  }

  if (!formData.description || formData.description.trim() === '') {
    errors.description = 'Detailed description is required for dispatch accuracy.';
  }

  if (formData.title && formData.title.length > 100) {
    errors.title = 'Title exceeds maximum allowed length (100 characters).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateImageSize = (file, maxSizeMB = 5) => {
  if (!file) return { isValid: true, error: null }; // No image is fine
  
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return { 
      isValid: false, 
      error: `File payload exceeds maximum capacity (${maxSizeMB}MB).` 
    };
  }
  
  return { isValid: true, error: null };
};