# Use standard Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json ./

# Debug: Show what we're trying to install
RUN echo "=== Package.json contents ===" && cat package.json

# Try to install dependencies with more verbose output
RUN npm install --production --verbose || (echo "NPM install failed" && exit 1)

# Debug: Show what was installed
RUN echo "=== Installed packages ===" && ls -la node_modules/

# Copy the rest of the application
COPY . .

# Create directories
RUN mkdir -p logs structures

# Expose port (if needed for future web interface)
EXPOSE 3000

# Start the bot directly
CMD ["node", "mineflayer-bot/index.js"]