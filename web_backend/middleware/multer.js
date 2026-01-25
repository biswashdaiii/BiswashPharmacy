import fs from 'fs';
import multer from 'multer';
import path from 'path';

const uploadPath = 'uploads';

// Security: Sanitize filename to prevent path traversal and exploits
const sanitizeFilename = (filename) => {
  // Remove path traversal characters
  let sanitized = filename.replace(/[/\\]/g, '');
  // Remove null bytes
  sanitized = sanitized.replace(/%00|\x00/g, '');
  // Remove any characters that could be problematic
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  return sanitized;
};

// Security: Check for double extension attacks (e.g., malware.php.jpg)
const hasDoubleExtension = (filename) => {
  const dangerousExtensions = ['php', 'exe', 'sh', 'bat', 'cmd', 'js', 'html', 'htm', 'asp', 'aspx', 'jsp'];
  const parts = filename.toLowerCase().split('.');

  if (parts.length > 2) {
    // Check if any middle part is a dangerous extension
    for (let i = 1; i < parts.length - 1; i++) {
      if (dangerousExtensions.includes(parts[i])) {
        return true;
      }
    }
  }
  return false;
};

// Security: Check for null-byte injection
const hasNullByte = (filename) => {
  return /%00|\x00/.test(filename);
};

// Automatically create the folder if it doesn't exist
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const sanitizedName = sanitizeFilename(file.originalname);
    cb(null, Date.now() + '-' + sanitizedName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Security: Check for null-byte injection
    if (hasNullByte(file.originalname)) {
      return cb(new Error('Invalid filename: null bytes detected'), false);
    }

    // Security: Check for double extension attacks
    if (hasDoubleExtension(file.originalname)) {
      return cb(new Error('Invalid filename: suspicious double extension detected'), false);
    }

    // Only allow common image formats
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
  }
});
export default upload;
