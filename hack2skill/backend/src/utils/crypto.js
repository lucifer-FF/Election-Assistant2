/**
 * ENCRYPTION & CRYPTO UTILITIES
 * AES-256 encryption for sensitive data at rest
 * Secure password hashing with Argon2
 * Secure random token generation
 */

import crypto from 'crypto';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'hex';

/**
 * Hash password using Argon2
 * Much more secure than bcrypt for this use case
 * SECURITY: Argon2 is winner of Password Hashing Competition
 */
export async function hashPassword(password) {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      saltLength: 32
    });
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    logger.error('Password verification error:', error);
    return false;
  }
}

/**
 * Encrypt sensitive data with AES-256-GCM
 * SECURITY: Uses GCM mode for authenticated encryption
 * Returns: { encrypted: string, iv: string, authTag: string }
 */
export function encryptData(plaintext, secret = process.env.API_KEY_ENCRYPTION_SECRET) {
  try {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secret, ENCODING), iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString(ENCODING),
      authTag: authTag.toString(ENCODING)
    };
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Data encryption failed');
  }
}

/**
 * Decrypt AES-256-GCM encrypted data
 * SECURITY: Verifies authentication tag before decryption
 */
export function decryptData(encryptedData, secret = process.env.API_KEY_ENCRYPTION_SECRET) {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(secret, ENCODING),
      Buffer.from(encryptedData.iv, ENCODING)
    );

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, ENCODING));

    // Decrypt
    let decrypted = decipher.update(encryptedData.encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Data decryption failed - authentication failed');
  }
}

/**
 * Generate secure random token
 * Used for verification codes, reset tokens, etc.
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate OTP (One-Time Password)
 * 6-digit numeric code
 */
export function generateOTP() {
  const otp = crypto.randomInt(100000, 999999);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return {
    code: otp.toString(),
    expiresAt
  };
}

/**
 * Generate JWT token payload with security metadata
 */
export function generateTokenPayload(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role || 'voter',
    permissions: user.permissions || [],
    iat: Math.floor(Date.now() / 1000),
    sessionId: uuidv4()
  };
}

/**
 * Generate UUID for resource IDs
 */
export function generateUUID() {
  return uuidv4();
}

/**
 * Hash sensitive data (non-reversible)
 * For storing things like API keys, email addresses
 */
export function hashSensitiveData(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate HMAC signature for API requests
 */
export function generateHMAC(message, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(message, signature, secret) {
  const expectedSignature = generateHMAC(message, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
