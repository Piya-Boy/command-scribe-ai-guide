import { createHash, randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { promisify } from 'util';

const JWT_SECRET = process.env.JWT_SECRET || 'ogcp';
const SALT_ROUNDS = 10;

export class AuthSecurity {
  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(password + salt)
      .digest('hex');
    return `${salt}:${hash}`;
  }

  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = createHash('sha256')
      .update(password + salt)
      .digest('hex');
    return hash === verifyHash;
  }

  static generateToken(userId: string): string {
    return sign({ userId }, JWT_SECRET, {
      expiresIn: '1h',
      algorithm: 'HS256'
    });
  }

  static async verifyToken(token: string): Promise<any> {
    try {
      const verifyAsync = promisify(verify) as (token: string, secret: string) => Promise<any>;
      return await verifyAsync(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
  }

  static validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }
} 