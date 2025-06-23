FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy everything into the container
COPY . .

# Install dependencies
RUN npm install mineflayer dotenv @google/generative-ai

# Start the bot
CMD ["bash", "start.sh"]