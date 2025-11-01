import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.ENCRYPTION_SECRET;

export function encryptPrivateKey(privateKey) {
  if (typeof privateKey !== 'string' || privateKey.length === 0) {
    throw new Error('Invalid private key: must be a non-empty string');
  }

  console.log(SECRET);

  if (!SECRET) {
    throw new Error('Encryption secret is not set in environment variables');
  }
  const secretBuffer = Buffer.from(SECRET, 'hex');
  if (secretBuffer.length !== 32) {
    throw new Error(
      'Invalid encryption secret: must be a 64-character hex string (32 bytes)'
    );
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', secretBuffer, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return { iv: iv.toString('hex'), content: encrypted, tag };
  } catch (error) {
    throw new Error('encryption failed: Invalid key, IV, or tampered data');
  }
}

export function decryptPrivateKey(encrypted) {
  if (
    typeof encrypted !== 'object' ||
    !encrypted.iv ||
    !encrypted.content ||
    !encrypted.tag ||
    typeof encrypted.iv !== 'string' ||
    typeof encrypted.content !== 'string' ||
    typeof encrypted.tag !== 'string'
  ) {
    throw new Error(
      'Invalid encrypted data: must have iv, content, and tag as strings'
    );
  }

  if (!SECRET) {
    throw new Error('Encryption secret is not set in environment variables');
  }
  const secretBuffer = Buffer.from(SECRET, 'hex');
  if (secretBuffer.length !== 32) {
    throw new Error(
      'Invalid encryption secret: must be a 64-character hex string (32 bytes)'
    );
  }

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      secretBuffer,
      Buffer.from(encrypted.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
    let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: Invalid key, IV, or tampered data');
  }
}
