# Use standard Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies including CMake for raknet-native
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Fix common Docker npm install SSL issues
RUN npm config set strict-ssl false

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