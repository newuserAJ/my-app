// Security configuration constants
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    GENERAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
    },
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
    },
    PASSWORD_RESET: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
    },
    CONTENT_CREATION: {
      windowMs: 60 * 1000, // 1 minute
      max: 10,
    },
    READ_OPERATIONS: {
      windowMs: 60 * 1000, // 1 minute
      max: 100,
    },
  },

  // Request size limits (in bytes)
  MAX_REQUEST_SIZE: {
    DEFAULT: 10 * 1024 * 1024, // 10MB
    FILE_UPLOAD: 50 * 1024 * 1024, // 50MB
    JSON: 1 * 1024 * 1024, // 1MB
    FORM_DATA: 5 * 1024 * 1024, // 5MB
  },

  // Security headers
  HEADERS: {
    CONTENT_SECURITY_POLICY: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
    },
    HSTS: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },

  // Validation patterns
  VALIDATION: {
    SUSPICIOUS_PATTERNS: [
      /\.\./,                    // Path traversal
      /<script/i,                // XSS attempts
      /union.*select/i,          // SQL injection
      /javascript:/i,            // JavaScript protocol
      /vbscript:/i,              // VBScript protocol
      /onload=/i,                // Event handlers
      /onerror=/i,               // Error handlers
      /document\.cookie/i,       // Cookie theft attempts
      /eval\s*\(/i,              // Eval injection
      /setTimeout\s*\(/i,        // setTimeout injection
      /setInterval\s*\(/i,       // setInterval injection
    ],
    
    MALICIOUS_USER_AGENTS: [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /openvas/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i,
    ],

    ALLOWED_FILE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/pdf',
    ],

    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },

  // IP and geolocation settings
  IP_SECURITY: {
    BLOCKED_COUNTRIES: [], // ISO country codes
    ALLOWED_IPS: [], // Whitelist for admin endpoints
    HONEYPOT_PATHS: ['/admin', '/wp-admin', '/.env', '/config'],
  },

  // Session and token settings
  TOKENS: {
    JWT_EXPIRY: '24h',
    REFRESH_TOKEN_EXPIRY: '7d',
    PASSWORD_RESET_EXPIRY: '1h',
    EMAIL_VERIFICATION_EXPIRY: '24h',
  },

  // Password requirements
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    MAX_LENGTH: 128,
    COMMON_PASSWORDS_CHECK: true,
  },

  // Monitoring and alerting thresholds
  MONITORING: {
    FAILED_LOGIN_THRESHOLD: 10, // Alert after 10 failed logins in 5 minutes
    SUSPICIOUS_REQUEST_THRESHOLD: 20, // Alert after 20 suspicious requests
    HIGH_ERROR_RATE_THRESHOLD: 0.05, // Alert if error rate exceeds 5%
    RESPONSE_TIME_THRESHOLD: 5000, // Alert if average response time exceeds 5s
  },

  // API versioning
  API: {
    SUPPORTED_VERSIONS: ['v1'],
    DEFAULT_VERSION: 'v1',
    DEPRECATION_WARNINGS: {
      // Version deprecation notices
    },
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Stricter limits for production
  SECURITY_CONFIG.RATE_LIMITS.GENERAL.max = 50;
  SECURITY_CONFIG.RATE_LIMITS.AUTH.max = 3;
  SECURITY_CONFIG.PASSWORD_POLICY.MIN_LENGTH = 12;
} else if (process.env.NODE_ENV === 'development') {
  // More lenient for development
  SECURITY_CONFIG.RATE_LIMITS.GENERAL.max = 1000;
  SECURITY_CONFIG.RATE_LIMITS.AUTH.max = 100;
}

// Helper functions
export const getSecurityConfig = (key: string) => {
  const keys = key.split('.');
  let config: any = SECURITY_CONFIG;
  
  for (const k of keys) {
    config = config[k];
    if (config === undefined) {
      throw new Error(`Security config key not found: ${key}`);
    }
  }
  
  return config;
};

export const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopmentEnvironment = () => {
  return process.env.NODE_ENV === 'development';
};

export const getMaxRequestSize = (type: keyof typeof SECURITY_CONFIG.MAX_REQUEST_SIZE = 'DEFAULT') => {
  return SECURITY_CONFIG.MAX_REQUEST_SIZE[type];
};

export const getRateLimit = (type: keyof typeof SECURITY_CONFIG.RATE_LIMITS) => {
  return SECURITY_CONFIG.RATE_LIMITS[type];
};