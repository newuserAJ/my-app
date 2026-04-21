#!/bin/bash

# Deployment script for My App Backend
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_NAME="my-app"
ENVIRONMENT=${1:-staging}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production)
            log "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if required files exist
    if [[ ! -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        error "docker-compose.yml not found"
    fi
    
    if [[ ! -f "$PROJECT_ROOT/backend/.env.$ENVIRONMENT" ]]; then
        warn ".env.$ENVIRONMENT not found, using .env if available"
    fi
    
    success "Prerequisites check passed"
}

# Build Docker images
build_images() {
    log "Building Docker images for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
            ;;
        staging|production)
            docker-compose build --no-cache
            ;;
    esac
    
    success "Docker images built successfully"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run tests in isolated container
    docker-compose -f docker-compose.dev.yml run --rm backend-test npm run test:ci
    
    success "Tests completed successfully"
}

# Deploy application
deploy_application() {
    log "Deploying application to $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing containers
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
            ;;
        staging|production)
            docker-compose down
            ;;
    esac
    
    # Start new containers
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
            ;;
        staging|production)
            docker-compose up -d
            ;;
    esac
    
    success "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    local health_url="http://localhost:8080/health"
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s "$health_url" > /dev/null; then
            success "Application is healthy"
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Database migration (if needed)
run_migrations() {
    log "Checking for database migrations..."
    
    # In a real scenario, you would run database migrations here
    # For now, we'll just log that this step exists
    log "No migrations to run (using Supabase)"
    
    success "Migration check completed"
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Clear caches, warm up services, etc.
    if [[ $ENVIRONMENT == "production" ]]; then
        log "Production post-deployment tasks..."
        # Add production-specific tasks here
    fi
    
    # Display application info
    log "Application Info:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Backend URL: http://localhost:8080"
    echo "  Health Check: http://localhost:8080/health"
    
    if [[ $ENVIRONMENT == "development" ]]; then
        echo "  Debug Port: 9229"
        echo "  Logs: docker-compose logs -f backend"
    fi
    
    success "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    warn "Rolling back deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Stop current containers
    docker-compose down
    
    # You would implement rollback logic here
    # For example, switching to previous image tags
    warn "Rollback implementation needed"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    cd "$PROJECT_ROOT"
    
    # Remove unused Docker images and containers
    docker image prune -f
    docker container prune -f
    
    success "Cleanup completed"
}

# Main deployment flow
main() {
    log "Starting deployment process for $APP_NAME ($ENVIRONMENT)"
    
    validate_environment
    check_prerequisites
    
    # Skip tests in development for faster deployment
    if [[ $ENVIRONMENT != "development" ]]; then
        run_tests
    fi
    
    build_images
    deploy_application
    run_migrations
    health_check
    post_deployment
    
    success "Deployment completed successfully!"
}

# Handle script arguments
case "${2:-}" in
    --rollback)
        rollback
        exit 0
        ;;
    --cleanup)
        cleanup
        exit 0
        ;;
    --help)
        echo "Usage: $0 [environment] [options]"
        echo ""
        echo "Environments:"
        echo "  development  - Local development environment"
        echo "  staging      - Staging environment"
        echo "  production   - Production environment"
        echo ""
        echo "Options:"
        echo "  --rollback   - Rollback the deployment"
        echo "  --cleanup    - Clean up Docker resources"
        echo "  --help       - Show this help message"
        exit 0
        ;;
esac

# Trap errors and cleanup
trap 'error "Deployment failed. Check logs above."' ERR

# Run main deployment
main