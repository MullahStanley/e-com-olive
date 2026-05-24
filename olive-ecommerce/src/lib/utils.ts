import crypto from 'crypto';


export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().split('-')[0].toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function sanitizeInput(input: string): string {
  // Properly escapes HTML entities to prevent XSS attacks
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Strict validation for Kenyan phone numbers
  // Matches: 07.., 01.., 2547.., +2541..
  const kenyaPhoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
  return kenyaPhoneRegex.test(phone.replace(/\s+/g, ''));
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  return { valid: true };
}

// Rate Limiter

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 900000 // 15 minutes
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Memory Leak Prevention: Randomly clean up expired records 10% of the time
  if (Math.random() < 0.1) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (now > val.resetTime) rateLimitStore.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}


// Formatting utilities

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0, // Removes the .00 for cleaner UI on whole amounts
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
