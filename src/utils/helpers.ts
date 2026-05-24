/**
 * Helper utilities for Kimi WebBridge
 */

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize string for safe usage
 */
export function sanitize(str: string): string {
  return str.replace(/[<>]/g, '');
}

/**
 * Parse CSS selector or @e ref
 */
export function parseSelector(selector: string): { type: 'ref' | 'css'; value: string } {
  if (selector.startsWith('@e')) {
    return { type: 'ref', value: selector };
  }
  return { type: 'css', value: selector };
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log with timestamp
 */
export function log(message: string, data?: any): void {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] ${message}`, data || '');
}

/**
 * Error logger
 */
export function errorLog(message: string, error?: any): void {
  const timestamp = getTimestamp();
  console.error(`[${timestamp}] ERROR: ${message}`, error || '');
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(backoff, i));
      }
    }
  }
  
  throw lastError;
}
