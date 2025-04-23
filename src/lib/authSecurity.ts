import { createHash, randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { promisify } from 'util';

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthSecurity {
  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(32).toString('hex');
    const hash = createHash('sha512')
      .update(password + salt)
      .digest('hex');
    return `${salt}:${hash}`;
  }

  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = createHash('sha512')
      .update(password + salt)
      .digest('hex');
    return hash === verifyHash;
  }

  static generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    const accessToken = sign(
      { userId, type: 'access' },
      JWT_SECRET,
      {
        expiresIn: TOKEN_EXPIRY,
        algorithm: 'HS512',
        jwtid: randomBytes(16).toString('hex')
      }
    );

    const refreshToken = sign(
      { userId, type: 'refresh' },
      JWT_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS512',
        jwtid: randomBytes(16).toString('hex')
      }
    );

    return { accessToken, refreshToken };
  }

  static async verifyToken(token: string, type: 'access' | 'refresh'): Promise<any> {
    try {
      const verifyAsync = promisify(verify) as (token: string, secret: string) => Promise<any>;
      const decoded = await verifyAsync(token, JWT_SECRET);
      
      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
  }

  static validatePasswordStrength(password: string): boolean {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoSpaces = !/\s/.test(password);
    const hasNoSequentialChars = !/(.)\1{2,}/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar &&
      hasNoSpaces &&
      hasNoSequentialChars
    );
  }

  static async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = await this.verifyToken(refreshToken, 'refresh');
      return this.generateTokens(decoded.userId).accessToken;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
} 