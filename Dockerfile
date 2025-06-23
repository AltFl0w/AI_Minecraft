# Use standard Node.js image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy and install just one simple dependency
COPY package.json ./
RUN npm install

# Copy app
COPY . .

# Create directories
RUN mkdir -p logs structures

# Expose port (if needed for future web interface)
EXPOSE 3000

# Test command
CMD ["echo", "Docker build successful!"]