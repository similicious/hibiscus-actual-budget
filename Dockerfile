FROM node:22-alpine

# Install required packages for user management
RUN apk add --no-cache \
    shadow \
    su-exec

WORKDIR /app

# Environment variables for runtime user management
ENV PUID=1000
ENV PGID=1000

# Copy entrypoint script first
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Create and set permissions for data and config directories
RUN mkdir -p data config && chown -R node:node /app

# Expose the application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Volumes for persistent data and configuration
VOLUME ["/app/data", "/app/config"]

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
