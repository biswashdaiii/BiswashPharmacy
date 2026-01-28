import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted data in format: iv:encryptedData:authTag
 */
export function encrypt(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

    if (!key || key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:encryptedData:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypts data encrypted with encrypt()
 * @param {string} data - Encrypted data in format: iv:encryptedData:authTag
 * @returns {string} - Decrypted plain text
 */
export function decrypt(data) {
    if (!data || typeof data !== 'string') {
        return data;
    }

    // If data doesn't contain colons, it's not encrypted (backward compatibility)
    if (!data.includes(':')) {
        return data;
    }

    try {
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

        if (!key || key.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
        }

        const parts = data.split(':');
        if (parts.length !== 3) {
            // Invalid format, return as-is
            return data;
        }

        const [ivHex, encryptedHex, authTagHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        // Return original data if decryption fails (backward compatibility)
        return data;
    }
}

/**
 * Encrypts an object's specified fields encrypting the data 
 * @param {Object} obj - Object to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
export function encryptFields(obj, fields) {
    const result = { ...obj };

    fields.forEach(field => {
        if (result[field]) {
            result[field] = encrypt(String(result[field]));
        }
    });

    return result;
}

/**
 * Decrypts an object's specified fields decrypting the encrypted data
 * @param {Object} obj - Object to decrypt
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
export function decryptFields(obj, fields) {
    const result = { ...obj };

    fields.forEach(field => {
        if (result[field]) {
            result[field] = decrypt(result[field]);
        }
    });

    return result;
}
