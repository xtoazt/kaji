# Multi-stage build for Kaji application
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build the React app
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Copy built frontend
COPY --from=frontend-builder /app/client/build ./public

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kaji -u 1001

# Change ownership of the app directory
RUN chown -R kaji:nodejs /app
USER kaji

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
