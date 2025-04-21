import CryptoJS from 'crypto-js';

const API_KEY_STORAGE_KEY = 'google_ai_api_key';
const ENCRYPTION_SALT = 'CommandScribe_Salt_v1'; // Salt for key derivation

// Generate a device-specific key if not exists
function getDeviceKey(): string {
  const DEVICE_KEY_STORAGE = 'device_specific_key';
  let deviceKey = localStorage.getItem(DEVICE_KEY_STORAGE);
  
  if (!deviceKey) {
    deviceKey = CryptoJS.lib.WordArray.random(32).toString();
    localStorage.setItem(DEVICE_KEY_STORAGE, deviceKey);
  }
  
  return deviceKey;
}

// Create a secure encryption key using PBKDF2
function deriveEncryptionKey(): string {
  const deviceKey = getDeviceKey();
  const iterations = 10000;
  
  return CryptoJS.PBKDF2(
    deviceKey,
    ENCRYPTION_SALT,
    {
      keySize: 256 / 32,
      iterations: iterations
    }
  ).toString();
}

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First try to get the key from localStorage
  const encryptedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (encryptedKey) {
    try {
      const encryptionKey = deriveEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedKey, encryptionKey);
      const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
      
      // Validate the decrypted key format
      if (decryptedKey.match(/^AIza[A-Za-z0-9_-]{35}$/)) {
        return decryptedKey;
      }
    } catch (error) {
      console.error('Error decrypting stored API key:', error);
    }
  }
  
  // If no valid key in localStorage, try environment variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.match(/^AIza[A-Za-z0-9_-]{35}$/)) {
    return envKey;
  }
  
  return null;
}

export function setApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Validate API key format before storing
    if (!apiKey.match(/^AIza[A-Za-z0-9_-]{35}$/)) {
      throw new Error('Invalid API key format');
    }
    
    const encryptionKey = deriveEncryptionKey();
    const encryptedKey = CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();
    localStorage.setItem(API_KEY_STORAGE_KEY, encryptedKey);
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw error;
  }
}

export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
} 