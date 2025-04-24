import { toast } from "@/components/ui/use-toast";

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (userRequests.count >= RATE_LIMIT.max) {
    return false;
  }

  userRequests.count++;
  return true;
};

// Input validation
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Audit logging
export const logSecurityEvent = (event: {
  type: string;
  userId?: string;
  ip?: string;
  details: string;
}) => {
  const timestamp = new Date().toISOString();
  console.log(`[Security Audit] ${timestamp} - ${event.type} - User: ${event.userId || 'anonymous'} - IP: ${event.ip || 'unknown'} - ${event.details}`);
  
  // In production, this should be sent to a proper logging service
  if (import.meta.env.PROD) {
    // TODO: Implement proper logging service integration
  }
};

// Error handling
export const handleSecurityError = (error: Error, context: string) => {
  logSecurityEvent({
    type: 'ERROR',
    details: `${context}: ${error.message}`
  });
  
  toast({
    title: "Security Error",
    description: "An error occurred. Please try again later.",
    variant: "destructive",
  });
};

// Session management
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const checkSessionTimeout = (lastActivity: number): boolean => {
  return Date.now() - lastActivity > SESSION_TIMEOUT;
};

// CSRF protection
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2);
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken;
}; 