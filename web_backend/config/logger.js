import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');

// Daily rotate file transport for all logs
const dailyRotateFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat
});

// Daily rotate file transport for errors only
const errorRotateFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    format: logFormat
});

// Daily rotate file transport for security events
const securityRotateFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d', // Keep security logs for 90 days
    format: logFormat
});

// Create the logger
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        dailyRotateFileTransport,
        errorRotateFileTransport,
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Create security-specific logger
export const securityLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        securityRotateFileTransport,
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Helper functions for common log patterns
export const logAuth = (action, data) => {
    securityLogger.info('AUTH_EVENT', {
        action,
        ...data,
        timestamp: new Date().toISOString()
    });
};

export const logError = (error, context = {}) => {
    logger.error('ERROR', {
        message: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString()
    });
};

export const logSecurity = (event, data) => {
    securityLogger.warn('SECURITY_EVENT', {
        event,
        ...data,
        timestamp: new Date().toISOString()
    });
};

// Track critical security events for alerting
const criticalEventCounts = new Map();

export const logCriticalSecurity = (event, data) => {
    const eventKey = `${event}_${data.userId || data.email || 'unknown'}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Get or initialize event tracking
    if (!criticalEventCounts.has(eventKey)) {
        criticalEventCounts.set(eventKey, []);
    }

    const events = criticalEventCounts.get(eventKey);

    // Remove events older than 1 hour
    const recentEvents = events.filter(timestamp => now - timestamp < oneHour);
    recentEvents.push(now);
    criticalEventCounts.set(eventKey, recentEvents);

    // Determine if this is a critical alert
    let isCritical = false;
    let alertReason = '';

    if (event === 'ACCOUNT_LOCKED' && recentEvents.length >= 3) {
        isCritical = true;
        alertReason = `Multiple account lockouts detected (${recentEvents.length} in 1 hour)`;
    } else if (event === 'ADMIN_ACCESS') {
        isCritical = true;
        alertReason = 'Admin access detected';
    } else if (event === 'OTP_MAX_ATTEMPTS' && recentEvents.length >= 3) {
        isCritical = true;
        alertReason = `Multiple failed MFA attempts (${recentEvents.length} in 1 hour)`;
    }

    securityLogger.error('CRITICAL_SECURITY_ALERT', {
        event,
        isCritical,
        alertReason: isCritical ? alertReason : 'N/A',
        occurrencesInLastHour: recentEvents.length,
        ...data,
        timestamp: new Date().toISOString()
    });

    // In production, you could send email/SMS/Slack notification here
    if (isCritical) {
        console.error(`🚨 CRITICAL SECURITY ALERT: ${alertReason}`);
    }
};


export default logger;
