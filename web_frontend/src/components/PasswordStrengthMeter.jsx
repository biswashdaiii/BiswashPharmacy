import React from 'react';

const PasswordStrengthMeter = ({ password }) => {
    const getStrength = (pass) => {
        let score = 0;
        if (!pass) return score;

        // Length
        if (pass.length > 7) score += 1;
        if (pass.length > 11) score += 1;

        // Variety
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
        if (/\d/.test(pass)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(pass)) score += 1;

        // Sequence check (matches backend rules)
        const hasSequence = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(pass);
        if (hasSequence) score = Math.max(1, score - 1);

        return score; // Max score 5
    };

    const strength = getStrength(password);

    const getColor = (s) => {
        switch (s) {
            case 0: return 'bg-gray-200';
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-blue-500';
            case 5: return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const getLabel = (s) => {
        switch (s) {
            case 0: return 'Too short';
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Strong';
            case 5: return 'Excellent';
            default: return '';
        }
    };

    return (
        <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                <span className={`text-xs font-bold ${strength > 0 ? 'text-opacity-100' : 'text-gray-400'}`}>
                    {getLabel(strength)}
                </span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={`h-full flex-1 transition-all duration-300 ${i < strength ? getColor(strength) : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>
            <ul className="mt-2 space-y-1">
                <li className={`text-[10px] flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    {password.length >= 8 ? '✓' : '○'} 8+ characters
                </li>
                <li className={`text-[10px] flex items-center gap-1 ${(/[A-Z]/.test(password) && /[a-z]/.test(password)) ? 'text-green-600' : 'text-gray-400'}`}>
                    {(/[A-Z]/.test(password) && /[a-z]/.test(password)) ? '✓' : '○'} Upper & Lowercase
                </li>
                <li className={`text-[10px] flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/\d/.test(password) ? '✓' : '○'} At least one number
                </li>
                <li className={`text-[10px] flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password) ? '✓' : '○'} Special character
                </li>
                <li className={`text-[10px] flex items-center gap-1 ${!/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password) ? 'text-green-600' : 'text-orange-500'}`}>
                    {!/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password) ? '✓' : '⚠'} No sequences (abc, 123)
                </li>
            </ul>
        </div>
    );
};

export default PasswordStrengthMeter;
