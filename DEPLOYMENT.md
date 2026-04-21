# Deployment Guide

This document provides comprehensive instructions for deploying the My App backend in different environments.

## Quick Start

```bash
# Development
./scripts/deploy.sh development

# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh production
```

## Prerequisites

### Required Software
- **Docker** (v20.0+)
- **Docker Compose** (v2.0+)
- **Node.js** (v18.0+ for local development)
- **Git**

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Set up environment variables:**
   ```bash
   # Copy template and customize
   cp backend/.env.template backend/.env.development
   cp backend/.env.template backend/.env.staging  
   cp backend/.env.template backend/.env.production
   
   # Generate secure keys
   cd backend && node scripts/generate-keys.js generate
   ```

3. **Configure Supabase:**
   - Create projects for each environment
   - Update environment files with Supabase credentials
   - Run the database schema (see `backend/database/README.md`)

## Environment Configurations

### Development Environment

**Purpose:** Local development with hot reloading and debugging

**Configuration:**
- Hot reloading enabled
- Debug port exposed (9229)
- Relaxed security settings
- Verbose logging
- Optional local database

**Deployment:**
```bash
./scripts/deploy.sh development
```

**Services:**
- Backend API (port 8080)
- Redis cache (port 6379)
- PostgreSQL (port 5432, optional)
- Nginx proxy (port 80)
- MailHog (ports 1025, 8025)

### Staging Environment

**Purpose:** Pre-production testing and validation

**Configuration:**
- Production-like settings
- Monitoring enabled
- Rate limiting active
- Performance testing

**Deployment:**
```bash
./scripts/deploy.sh staging
```

**Requirements:**
- Staging Supabase project
- Staging domain/subdomain
- SSL certificates
- Environment-specific secrets

### Production Environment

**Purpose:** Live production system

**Configuration:**
- Maximum security settings
- Performance optimizations
- Monitoring and alerting
- Backup and disaster recovery

**Deployment:**
```bash
./scripts/deploy.sh production
```

**Requirements:**
- Production Supabase project
- Production domain with SSL
- Secret management system
- Monitoring and logging
- Backup strategy

## Deployment Methods

### 1. Docker Compose (Recommended for Small-Medium Scale)

**Advantages:**
- Simple setup and management
- Consistent across environments
- Easy rollbacks
- Built-in health checks

**Usage:**
```bash
# Production deployment
docker-compose up -d

# Development deployment  
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### 2. Cloud Platforms

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create my-app-backend

# Add environment variables
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your_url

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
```bash
# Use the App Platform dashboard or doctl CLI
doctl apps create --spec .do/app.yaml
```

#### AWS ECS/Fargate
See `aws-deployment.md` for detailed AWS deployment instructions.

## Environment Variables

### Required Variables
```bash
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_secure_jwt_secret_64_chars_minimum
```

### Optional Variables
```bash
# Security
ALLOWED_ORIGINS=https://yourapp.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn

# Caching
REDIS_URL=redis://localhost:6379
```

### Validation
```bash
# Validate environment configuration
cd backend && node scripts/validate-env.js production
```

## SSL/TLS Configuration

### Development (Self-Signed)
```bash
# Generate self-signed certificates
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes
```

### Production (Let's Encrypt)
```bash
# Using Certbot
certbot --nginx -d yourdomain.com
```

### Production (Custom Certificate)
Place your certificates in:
- `nginx/ssl/cert.pem` (certificate)
- `nginx/ssl/key.pem` (private key)

## Monitoring and Logging

### Application Logs
```bash
# View real-time logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f nginx
docker-compose logs -f redis
```

### Health Checks
- **Application Health:** `http://your-domain/health`
- **Supabase Health:** `http://your-domain/health/supabase`

### Monitoring Stack
- **Application:** Sentry for error tracking
- **Infrastructure:** Prometheus + Grafana
- **Uptime:** UptimeRobot or Pingdom
- **Logs:** ELK Stack or similar

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing
Configure Nginx upstream with multiple backend instances:
```nginx
upstream backend {
    server backend_1:8080;
    server backend_2:8080;
    server backend_3:8080;
}
```

### Database Scaling
- Use Supabase read replicas
- Implement connection pooling
- Consider caching with Redis

## Backup and Recovery

### Database Backups
Supabase provides automated backups. For additional safety:
```bash
# Export schema and data
pg_dump postgresql://postgres:password@host:5432/database > backup.sql
```

### Application Backups
- Docker images stored in registry
- Configuration files in version control
- Environment variables in secure storage

### Disaster Recovery
1. Deploy to new infrastructure
2. Restore database from backup
3. Update DNS records
4. Validate application functionality

## Security Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Database security enabled

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Security headers validated
- [ ] Rate limiting tested
- [ ] Backup strategy verified

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check configuration
docker-compose config

# Rebuild container
docker-compose build --no-cache backend
```

#### Health Check Failures
```bash
# Test health endpoint directly
curl -f http://localhost:8080/health

# Check Supabase connectivity
curl -f http://localhost:8080/health/supabase
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost:8080/metrics
```

### Debug Mode
```bash
# Enable debug logging
docker-compose up -d
docker-compose exec backend node --inspect=0.0.0.0:9229 lib/index.js
```

## Rollback Procedures

### Quick Rollback
```bash
./scripts/deploy.sh production --rollback
```

### Manual Rollback
```bash
# Stop current version
docker-compose down

# Switch to previous image tag
docker-compose up -d --force-recreate
```

## Performance Optimization

### Production Optimizations
- Enable gzip compression in Nginx
- Configure proper caching headers
- Use Redis for session storage
- Optimize Docker image layers
- Configure connection pooling

### Monitoring Performance
```bash
# Application response times
curl -w "@curl-format.txt" -o /dev/null -s http://your-domain/api/posts

# Database query performance
# Check Supabase dashboard for slow queries
```

## Cost Optimization

### Resource Management
- Right-size containers based on usage
- Use multi-stage Docker builds
- Implement proper caching
- Monitor resource utilization

### Cloud Cost Management
- Use reserved instances where applicable
- Implement auto-scaling policies
- Monitor and alert on costs
- Regular cost analysis and optimization

## Support and Maintenance

### Regular Tasks
- Monitor application health
- Review and rotate secrets
- Update dependencies
- Backup verification
- Performance monitoring

### Emergency Procedures
- Incident response plan
- Escalation procedures
- Communication channels
- Recovery procedures

For additional support, refer to:
- Application logs and monitoring
- Cloud provider documentation
- Supabase support resources
- Community forums and documentation