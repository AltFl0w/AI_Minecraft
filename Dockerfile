# Use the official Node.js 18 LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with verbose logging for debugging
RUN npm ci --only=production --verbose

# Copy the rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p logs structures

# Expose port (if needed for future web interface)
EXPOSE 3000

# Set the command to run the bot
CMD ["npm", "start"]