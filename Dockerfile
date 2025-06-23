# Use standard Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies that might be needed for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY package.json ./
RUN npm install --production

# Copy app
COPY . .

# Create necessary directories
RUN mkdir -p logs structures

# Expose port (if needed for future web interface)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]