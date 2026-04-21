#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate secure keys for the application
 */
function generateKeys() {
  console.log('🔐 Generating secure keys...\n');

  const keys = {
    JWT_SECRET: generateSecureKey(64),
    SESSION_SECRET: generateSecureKey(32),
    ENCRYPTION_KEY: generateSecureKey(32),
    API_KEY: generateAPIKey(),
  };

  // Display generated keys
  console.log('Generated Keys:');
  console.log('==============');
  Object.entries(keys).forEach(([name, value]) => {
    console.log(`${name}=${value}`);
  });

  // Save to .env.keys file for reference
  const keysFilePath = path.join(__dirname, '..', '.env.keys');
  const envContent = Object.entries(keys)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(keysFilePath, envContent);
  
  console.log('\n✅ Keys saved to .env.keys file');
  console.log('⚠️  Remember to:');
  console.log('   1. Copy these keys to your .env file');
  console.log('   2. Add .env.keys to .gitignore (already done)');
  console.log('   3. Store these keys securely in your production environment');
  console.log('   4. Never commit these keys to version control\n');

  return keys;
}

/**
 * Generate a cryptographically secure random key
 * @param {number} length - Length in bytes
 * @returns {string} - Base64 encoded key
 */
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate a secure API key
 * @returns {string} - API key with prefix
 */
function generateAPIKey() {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `myapp_${randomPart}`;
}

/**
 * Generate environment-specific configurations
 */
function generateEnvTemplate() {
  const template = `# Generated Environment Configuration Template
# Copy this to your .env file and update the values

# Environment
NODE_ENV=development

# Server Configuration
PORT=8080
HOST=localhost

# Supabase Configuration (Get from Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
# EMAIL_SERVICE=sendgrid
# EMAIL_API_KEY=your_email_api_key
# EMAIL_FROM=noreply@yourapp.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_STORAGE=supabase

# AWS Configuration (If using S3)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_S3_BUCKET=your-bucket-name

# Redis Configuration (Optional)
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=your_redis_password

# Monitoring Configuration (Optional)
# SENTRY_DSN=your_sentry_dsn
# ANALYTICS_API_KEY=your_analytics_key

# Feature Flags
ENABLE_RATE_LIMITING=true
ENABLE_REQUEST_LOGGING=true
ENABLE_SECURITY_HEADERS=true
ENABLE_SWAGGER_DOCS=false

# Development Configuration
ENABLE_HOT_RELOAD=true
DEBUG_MODE=false
`;

  const templatePath = path.join(__dirname, '..', '.env.template');
  fs.writeFileSync(templatePath, template);
  
  console.log('📝 Environment template created at .env.template');
}

/**
 * Validate existing environment configuration
 */
function validateEnvironment() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    console.log('💡 Run: cp .env.template .env');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ];

  const missingVars = [];
  const weakSecrets = [];

  requiredVars.forEach(varName => {
    const match = envContent.match(new RegExp(`^${varName}=(.*)$`, 'm'));
    if (!match || !match[1] || match[1].trim() === '' || match[1].includes('your_')) {
      missingVars.push(varName);
    } else if ((varName === 'JWT_SECRET' && match[1].length < 32)) {
      weakSecrets.push(`${varName} (too short)`);
    }
  });

  if (missingVars.length > 0) {
    console.log('❌ Missing or invalid environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
  }

  if (weakSecrets.length > 0) {
    console.log('⚠️  Weak security configuration:');
    weakSecrets.forEach(issue => console.log(`   - ${issue}`));
  }

  if (missingVars.length === 0 && weakSecrets.length === 0) {
    console.log('✅ Environment configuration looks good!');
    return true;
  }

  return false;
}

/**
 * Generate production-ready configuration checklist
 */
function generateProductionChecklist() {
  const checklist = `# Production Deployment Checklist

## Security Configuration
- [ ] Generate new JWT secret (minimum 64 characters)
- [ ] Set strong BCRYPT_SALT_ROUNDS (12 or higher)
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Enable all security features
- [ ] Set NODE_ENV=production

## Secrets Management
- [ ] Store secrets in environment variables (not in code)
- [ ] Use secret management service (AWS Secrets Manager, etc.)
- [ ] Rotate secrets regularly
- [ ] Implement secret scanning in CI/CD

## Database Configuration
- [ ] Use production Supabase project
- [ ] Configure database connection pooling
- [ ] Set up database backups
- [ ] Enable Row Level Security (RLS)

## Monitoring & Logging
- [ ] Configure Sentry for error tracking
- [ ] Set LOG_LEVEL=warn or error
- [ ] Set up log aggregation
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring

## Performance
- [ ] Enable caching (Redis)
- [ ] Configure CDN for static assets
- [ ] Set appropriate rate limits
- [ ] Enable compression

## Infrastructure
- [ ] Use HTTPS/TLS certificates
- [ ] Configure load balancer
- [ ] Set up auto-scaling
- [ ] Configure firewall rules
- [ ] Set up disaster recovery

## CI/CD
- [ ] Automated security scanning
- [ ] Automated testing in pipeline
- [ ] Staged deployment process
- [ ] Rollback strategy
- [ ] Environment-specific configurations
`;

  const checklistPath = path.join(__dirname, '..', 'PRODUCTION_CHECKLIST.md');
  fs.writeFileSync(checklistPath, checklist);
  
  console.log('📋 Production checklist created at PRODUCTION_CHECKLIST.md');
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'generate':
      generateKeys();
      break;
    case 'template':
      generateEnvTemplate();
      break;
    case 'validate':
      validateEnvironment();
      break;
    case 'checklist':
      generateProductionChecklist();
      break;
    case 'all':
      generateKeys();
      generateEnvTemplate();
      generateProductionChecklist();
      break;
    default:
      console.log('Usage: node scripts/generate-keys.js <command>');
      console.log('Commands:');
      console.log('  generate  - Generate secure keys');
      console.log('  template  - Create .env template');
      console.log('  validate  - Validate existing .env');
      console.log('  checklist - Create production checklist');
      console.log('  all       - Run all commands');
      break;
  }
}

module.exports = {
  generateKeys,
  generateSecureKey,
  generateAPIKey,
  generateEnvTemplate,
  validateEnvironment,
  generateProductionChecklist,
};