// Password validation utility

// Common weak passwords to reject
const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
    'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
    'sunshine', 'ashley', 'bailey', 'shadow', 'superman', 'password1'
];

/**
 * Validate password strength to check if the password is strong enough
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[], strength: string }
 */
export const validatePassword = (password) => {
    const errors = [];

    // Check minimum length
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Check maximum length (prevent DoS attack)
    if (password && password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    // Check for common passwords
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a stronger password');
    }

    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
        errors.push('Password should not contain sequential characters');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Password should not contain repeated characters (e.g., aaa, 111)');
    }

    // Calculate password strength
    let strength = 'weak';
    if (errors.length === 0) {
        const hasLongLength = password.length >= 12;
        const hasMultipleSpecialChars = (password.match(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/g) || []).length >= 2;
        const hasMultipleNumbers = (password.match(/\d/g) || []).length >= 2;

        if (hasLongLength && hasMultipleSpecialChars && hasMultipleNumbers) {
            strength = 'strong';
        } else if (password.length >= 10) {
            strength = 'medium';
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength
    };
};

/**
 * Get password strength score (0-100)
 * @param {string} password
 * @returns {number}
 */
export const getPasswordStrength = (password) => {
    if (!password) return 0;

    let score = 0;

    // Length score (max 30 points)
    score += Math.min(password.length * 2, 30);

    // Character variety (max 40 points)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score += 10;

    // Complexity bonus (max 30 points)
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);

    // No sequential or repeated characters bonus
    if (!/(.)\1{2,}/.test(password)) score += 5;
    if (!/(?:abc|bcd|cde|123|234|345)/i.test(password)) score += 5;

    // Penalty for common passwords
    if (commonPasswords.includes(password.toLowerCase())) {
        score = Math.max(score - 50, 0);
    }

    return Math.min(score, 100);
};

export default validatePassword;
