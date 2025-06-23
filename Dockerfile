FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies for bedrock-protocol
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm ci --only=production --verbose

# Copy the rest of the application
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]