#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Validate environment configuration
 */
class EnvironmentValidator {
  constructor(environment = 'development') {
    this.environment = environment;
    this.errors = [];
    this.warnings = [];
    this.envVars = {};
  }

  /**
   * Load environment variables from .env file
   */
  loadEnvironment() {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
      this.errors.push('.env file not found');
      return false;
    }

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            this.envVars[key] = valueParts.join('=');
          }
        }
      });

      return true;
    } catch (error) {
      this.errors.push(`Failed to read .env file: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate required environment variables
   */
  validateRequired() {
    const required = {
      NODE_ENV: {
        required: true,
        values: ['development', 'test', 'staging', 'production'],
        description: 'Application environment'
      },
      PORT: {
        required: true,
        type: 'number',
        min: 1000,
        max: 65535,
        description: 'Server port number'
      },
      SUPABASE_URL: {
        required: true,
        type: 'url',
        description: 'Supabase project URL'
      },
      SUPABASE_ANON_KEY: {
        required: true,
        minLength: 10,
        description: 'Supabase anonymous key'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        required: true,
        minLength: 10,
        description: 'Supabase service role key'
      },
      JWT_SECRET: {
        required: true,
        minLength: 32,
        description: 'JWT signing secret'
      },
    };

    Object.entries(required).forEach(([key, config]) => {
      this.validateVariable(key, config);
    });
  }

  /**
   * Validate environment-specific requirements
   */
  validateEnvironmentSpecific() {
    const nodeEnv = this.envVars.NODE_ENV || 'development';

    switch (nodeEnv) {
      case 'production':
        this.validateProduction();
        break;
      case 'staging':
        this.validateStaging();
        break;
      case 'development':
        this.validateDevelopment();
        break;
      case 'test':
        this.validateTest();
        break;
    }
  }

  /**
   * Validate production environment
   */
  validateProduction() {
    // Required for production
    const productionRequired = {
      ALLOWED_ORIGINS: {
        required: true,
        description: 'CORS allowed origins'
      },
      LOG_LEVEL: {
        required: true,
        values: ['error', 'warn'],
        description: 'Production log level should be error or warn'
      },
    };

    Object.entries(productionRequired).forEach(([key, config]) => {
      this.validateVariable(key, config);
    });

    // Security checks for production
    this.validateProductionSecurity();
  }

  /**
   * Validate production security settings
   */
  validateProductionSecurity() {
    // JWT secret should be very strong in production
    const jwtSecret = this.envVars.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 64) {
      this.warnings.push('JWT_SECRET should be at least 64 characters in production');
    }

    // Check for default/weak values
    const weakDefaults = [
      'your_',
      'changeme',
      'secret',
      'password',
      'test',
      'demo',
    ];

    Object.entries(this.envVars).forEach(([key, value]) => {
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
        weakDefaults.forEach(weak => {
          if (value.toLowerCase().includes(weak)) {
            this.errors.push(`${key} appears to contain a weak/default value`);
          }
        });
      }
    });

    // CORS should not allow all origins in production
    const allowedOrigins = this.envVars.ALLOWED_ORIGINS;
    if (allowedOrigins && allowedOrigins.includes('*')) {
      this.errors.push('ALLOWED_ORIGINS should not contain wildcards in production');
    }
  }

  /**
   * Validate staging environment
   */
  validateStaging() {
    const stagingRequired = {
      ALLOWED_ORIGINS: {
        required: true,
        description: 'CORS allowed origins'
      },
    };

    Object.entries(stagingRequired).forEach(([key, config]) => {
      this.validateVariable(key, config);
    });
  }

  /**
   * Validate development environment
   */
  validateDevelopment() {
    // Development-specific warnings
    if (!this.envVars.FRONTEND_URL) {
      this.warnings.push('FRONTEND_URL not set - may cause CORS issues');
    }
  }

  /**
   * Validate test environment
   */
  validateTest() {
    // Test environment should have minimal logging
    if (this.envVars.LOG_LEVEL && !['error', 'warn'].includes(this.envVars.LOG_LEVEL)) {
      this.warnings.push('LOG_LEVEL should be error or warn in test environment');
    }
  }

  /**
   * Validate a single environment variable
   */
  validateVariable(key, config) {
    const value = this.envVars[key];

    // Check if required
    if (config.required && (!value || value.trim() === '')) {
      this.errors.push(`${key} is required but not set`);
      return;
    }

    if (!value) return; // Skip further validation if not set and not required

    // Check allowed values
    if (config.values && !config.values.includes(value)) {
      this.errors.push(`${key} must be one of: ${config.values.join(', ')}`);
    }

    // Check type
    if (config.type) {
      switch (config.type) {
        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            this.errors.push(`${key} must be a valid number`);
          } else {
            if (config.min && num < config.min) {
              this.errors.push(`${key} must be at least ${config.min}`);
            }
            if (config.max && num > config.max) {
              this.errors.push(`${key} must be at most ${config.max}`);
            }
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            this.errors.push(`${key} must be a valid URL`);
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            this.errors.push(`${key} must be a valid email address`);
          }
          break;
      }
    }

    // Check minimum length
    if (config.minLength && value.length < config.minLength) {
      this.errors.push(`${key} must be at least ${config.minLength} characters long`);
    }

    // Check maximum length
    if (config.maxLength && value.length > config.maxLength) {
      this.errors.push(`${key} must be at most ${config.maxLength} characters long`);
    }
  }

  /**
   * Validate optional configurations
   */
  validateOptional() {
    const optional = {
      DATABASE_URL: {
        type: 'url',
        description: 'Database connection URL'
      },
      REDIS_URL: {
        type: 'url',
        description: 'Redis connection URL'
      },
      EMAIL_FROM: {
        type: 'email',
        description: 'Email sender address'
      },
      SENTRY_DSN: {
        type: 'url',
        description: 'Sentry error tracking URL'
      },
      BCRYPT_SALT_ROUNDS: {
        type: 'number',
        min: 10,
        max: 15,
        description: 'Bcrypt salt rounds'
      },
    };

    Object.entries(optional).forEach(([key, config]) => {
      if (this.envVars[key]) {
        this.validateVariable(key, { ...config, required: false });
      }
    });
  }

  /**
   * Check for common security issues
   */
  validateSecurity() {
    // Check for potentially exposed secrets in common locations
    const potentialSecrets = Object.entries(this.envVars).filter(([key, value]) => {
      return (
        key.includes('SECRET') ||
        key.includes('KEY') ||
        key.includes('PASSWORD') ||
        key.includes('TOKEN')
      ) && value.length > 10;
    });

    if (potentialSecrets.length === 0) {
      this.warnings.push('No secrets detected - make sure sensitive values are properly configured');
    }

    // Check for development/test values in production
    if (this.environment === 'production') {
      potentialSecrets.forEach(([key, value]) => {
        if (value.includes('test') || value.includes('dev') || value.includes('local')) {
          this.errors.push(`${key} appears to contain development/test values in production`);
        }
      });
    }
  }

  /**
   * Run all validations
   */
  validate() {
    console.log(`🔍 Validating environment configuration for: ${this.environment}\n`);

    if (!this.loadEnvironment()) {
      return false;
    }

    this.validateRequired();
    this.validateEnvironmentSpecific();
    this.validateOptional();
    this.validateSecurity();

    return this.reportResults();
  }

  /**
   * Report validation results
   */
  reportResults() {
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;

    if (hasErrors) {
      console.log('❌ Configuration Errors:');
      this.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log('');
    }

    if (hasWarnings) {
      console.log('⚠️  Configuration Warnings:');
      this.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
      console.log('');
    }

    if (!hasErrors && !hasWarnings) {
      console.log('✅ Environment configuration is valid!');
    } else if (!hasErrors) {
      console.log('✅ Environment configuration is valid (with warnings)');
    }

    // Summary
    console.log(`📊 Validation Summary:`);
    console.log(`   Environment: ${this.environment}`);
    console.log(`   Variables checked: ${Object.keys(this.envVars).length}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    return !hasErrors;
  }

  /**
   * Generate environment report
   */
  generateReport() {
    const report = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      variables: Object.keys(this.envVars),
      errors: this.errors,
      warnings: this.warnings,
      valid: this.errors.length === 0,
    };

    const reportPath = path.join(__dirname, '..', `env-report-${this.environment}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Environment report saved to: env-report-${this.environment}.json`);
    return report;
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  const environment = process.argv[2] || process.env.NODE_ENV || 'development';
  
  const validator = new EnvironmentValidator(environment);
  const isValid = validator.validate();
  
  // Generate report if requested
  if (process.argv.includes('--report')) {
    validator.generateReport();
  }

  // Exit with appropriate code
  process.exit(isValid ? 0 : 1);
}

module.exports = { EnvironmentValidator };