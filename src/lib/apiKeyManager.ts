import CryptoJS from 'crypto-js';

const API_KEY_STORAGE_KEY = 'google_ai_api_key';

// Generate a dynamic salt based on user session
function generateDynamicSalt(): string {
  const timestamp = Date.now();
  const random = CryptoJS.lib.WordArray.random(16).toString();
  return `CommandScribe_Salt_v1_${timestamp}_${random}`;
}

// Store API key securely
export async function setApiKey(apiKey: string): Promise<void> {
  try {
    // Validate API key format
    if (!apiKey.match(/^AIza[A-Za-z0-9_-]{35}$/)) {
      throw new Error('Invalid API key format');
    }

    // Store in localStorage
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error storing API key:', error);
    throw error;
  }
}

// Get API key from environment variables or localStorage
export async function getApiKey(): Promise<string | null> {
  try {
    // First try environment variable
    const envApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (envApiKey) {
      return envApiKey;
    }

    // Then try localStorage
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      return storedApiKey;
    }

    console.error('Google AI API key not found in environment variables or localStorage');
    return null;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
}

// Get CSRF token from server
async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf-token', {
    credentials: 'include'
  });
  const data = await response.json();
  return data.token;
}

export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function hasApiKey(): boolean {
  return !!import.meta.env.VITE_GOOGLE_AI_API_KEY || !!localStorage.getItem(API_KEY_STORAGE_KEY);
} 