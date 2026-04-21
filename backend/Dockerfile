# Multi-stage Docker build for Node.js backend

# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building (including native modules)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=backend:nodejs /app/lib ./lib

# Copy necessary runtime files
COPY --chown=backend:nodejs database ./database
COPY --chown=backend:nodejs scripts ./scripts

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R backend:nodejs logs

# Switch to non-root user
USER backend

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "lib/index.js"]

# ============================================
# Development Stage (for local development)
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Install all dependencies including dev dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port and debug port
EXPOSE 8080 9229

# Start with nodemon for hot reloading
CMD ["npm", "run", "dev"]

# ============================================
# Testing Stage
# ============================================
FROM node:20-alpine AS testing

WORKDIR /app

# Install all dependencies including dev and test dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Run tests
RUN npm run test:ci

# Keep the container alive for CI/CD to extract results
CMD ["tail", "-f", "/dev/null"]