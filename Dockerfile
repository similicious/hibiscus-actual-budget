FROM node:22-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S appuser && adduser -S -G appuser appuser

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Create and set permissions for data and config directories
RUN mkdir -p data config && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Volumes for persistent data and configuration
VOLUME ["/app/data", "/app/config"]

# Start the application using tsx
CMD ["npx", "tsx", "src/index.ts"]
