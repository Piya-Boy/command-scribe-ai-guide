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

    // Send to server for secure storage
    const response = await fetch('/api/secure/key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': await getCsrfToken()
      },
      body: JSON.stringify({ apiKey }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to store API key');
    }
  } catch (error) {
    console.error('Error storing API key:', error);
    throw error;
  }
}

// Retrieve API key securely
export async function getApiKey(): Promise<string | null> {
  try {
    const response = await fetch('/api/secure/key', {
      method: 'GET',
      headers: {
        'X-CSRF-Token': await getCsrfToken()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.apiKey;
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
  return !!getApiKey();
} 