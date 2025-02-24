#!/bin/sh
set -e

# Set user and group (from PUID/PGID env vars)
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "Initializing container with PUID: $PUID, PGID: $PGID"

# Create group with specified PGID if it doesn't exist
groupmod -o -g "$PGID" node

# Update user with specified PUID
usermod -o -u "$PUID" node

# Fix permissions
chown -R node:node /app

# Start the application as node user
exec su-exec node:node npx tsx src/index.ts
