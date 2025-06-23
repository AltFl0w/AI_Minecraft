FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Create logs and structures directories
RUN mkdir -p logs structures

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]