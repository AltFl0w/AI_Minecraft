import { createClient } from 'bedrock-protocol';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { config, validateConfig, isAdminUser, isCommandAllowed } from './config.js';
import { CommandHandler } from './commands.js';

class MinecraftAIBot {
  constructor() {
    // Validate configuration
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      console.error('Configuration errors:');
      configErrors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    }

    this.genAI = new GoogleGenerativeAI(config.ai.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.ai.model });
    this.client = null;
    this.commandHistory = [];
    this.structures = new Map();
    this.commandHandler = new CommandHandler(null, this.model); // Client will be set later
    this.lastCommandTime = new Map(); // For cooldown tracking
    this.isConnected = false;
    
    // Load structure mappings
    this.loadStructures();
  }

  async loadStructures() {
    try {
      const structuresPath = path.join(process.cwd(), config.structures.directory);
      await fs.mkdir(structuresPath, { recursive: true });
      
      const files = await fs.readdir(structuresPath).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.mcstructure')) {
          const name = file.replace('.mcstructure', '').toLowerCase();
          this.structures.set(name, file);
        }
      }
      
      console.log(`✓ Loaded ${this.structures.size} structure files`);
      if (config.bot.debugMode && this.structures.size > 0) {
        console.log('Available structures:', Array.from(this.structures.keys()).join(', '));
      }
    } catch (error) {
      console.error('Error loading structures:', error);
    }
  }

  createBot() {
    console.log(`🔌 Connecting to Bedrock server ${config.server.ip}:${config.server.port}...`);
    
    try {
              this.client = createClient({
          host: config.server.ip,
          port: config.server.port,
          username: config.server.botName,
          offline: false // Xbox Live authentication required
        });

      // Update command handler with client reference
      this.commandHandler.bot = this.client;

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Error creating client:', error);
      if (config.bot.autoReconnect) {
        console.log(`🔄 Retrying connection in ${config.bot.reconnectDelay / 1000} seconds...`);
        setTimeout(() => this.createBot(), config.bot.reconnectDelay);
      }
    }
  }

  setupEventHandlers() {
    this.client.on('spawn', () => {
      console.log(`✅ Bot successfully logged in as ${config.server.botName}`);
      console.log(`✅ Connected to ${config.server.ip}:${config.server.port}`);
      this.isConnected = true;
      console.log('🤖 AI Admin Bot is online! Ready to respond to @admin commands.');
    });

    this.client.on('error', (err) => {
      console.error('❌ Bot error:', err);
      this.isConnected = false;
    });

    this.client.on('disconnect', (reason) => {
      console.log(`❌ Bot disconnected: ${reason}`);
      this.isConnected = false;
      if (config.bot.autoReconnect) {
        console.log(`🔄 Reconnecting in ${config.bot.reconnectDelay / 1000} seconds...`);
        setTimeout(() => this.createBot(), config.bot.reconnectDelay);
      }
    });

    // Log all packets to understand the structure
    this.client.on('packet', (data) => {
      if (data.name === 'text') {
        console.log('📝 Received text packet:', JSON.stringify(data.params, null, 2));
      }
    });

    this.client.on('text', async (packet) => {
      // Handle chat messages from Bedrock protocol
      console.log('💬 Text event:', JSON.stringify(packet, null, 2));
      
      // Check different possible structures
      if (packet.type === 'chat' && packet.source_name && packet.message) {
        const username = packet.source_name;
        const message = packet.message;
        
        console.log(`💬 Chat from ${username}: ${message}`);
        
        if (username === config.server.botName) return;
        
        await this.handleChatMessage(username, message);
      }
    });

    // Also listen for other possible chat events
    this.client.on('packet', async (data) => {
      if (data.name === 'text' && data.params) {
        console.log('📦 Text packet:', JSON.stringify(data.params, null, 2));
      }
    });

    this.client.on('join', () => {
      console.log('✓ Bot joined the world');
    });
  }

  // Helper method to send chat messages
  sendChat(message) {
    if (!this.isConnected) return;
    
    try {
      this.client.write('text', {
        type: 'chat',
        needs_translation: false,
        source_name: config.server.botName,
        message: message,
        parameters: [],
        xuid: '',
        platform_chat_id: ''
      });
    } catch (error) {
      console.error('Error sending chat:', error);
    }
  }

  // Helper method to execute commands
  executeCommand(command) {
    if (!this.isConnected) return;
    
    try {
      this.client.write('command_request', {
        command: command,
        origin: {
          type: 'player',
          uuid: '',
          request_id: ''
        },
        internal: false,
        version: 1
      });
    } catch (error) {
      console.error('Error executing command:', error);
    }
  }

  async handleChatMessage(username, message) {
    // Skip if message is from the bot itself
    if (username === config.server.botName) return;
    
    // Check if message is directed at the bot
    const isDirectedAtBot = message.toLowerCase().includes('@admin') || 
                           message.toLowerCase().includes(config.server.botName.toLowerCase());
    
    if (!isDirectedAtBot) return;
    
    // Clean the message
    const cleanMessage = message.replace(/@admin/gi, '').trim();
    
    if (config.bot.debugMode) {
      console.log(`🎮 Kid ${username} said: "${cleanMessage}"`);
    }
    
    // Check cooldown
    if (this.isOnCooldown(username)) {
      this.sendChat(`⏰ Hey ${username}! Please wait a moment before asking again! ✨`);
      return;
    }
    
    // Update cooldown
    this.updateCooldown(username);
    
    // Check if user is admin
    const isAdmin = config.isAdmin(username);
    
    // Friendly greeting response
    this.sendChat(`👋 Hi ${username}! Let me help you with that! 🌟`);
    
    // Route to appropriate command handler using new knowledge-based system
    try {
      await this.processCommand(username, cleanMessage, isAdmin);
    } catch (error) {
      console.error(`❌ Error processing command:`, error);
      this.sendChat(`🤖 Oops! Something went wrong, ${username}! Let me try to help you another way! 🔧`);
    }
  }

  isOnCooldown(username) {
    const lastTime = this.lastCommandTime.get(username);
    if (!lastTime) return false;
    
    return Date.now() - lastTime < config.bot.commandCooldown;
  }

  updateCooldown(username) {
    this.lastCommandTime.set(username, Date.now());
  }

  async processCommand(username, message, isAdmin) {
    // Route to appropriate handler
    const commandType = this.categorizeCommand(message);
    
    // Route to appropriate command handler using new knowledge-based system
    await this.commandHandler.handleCommand(username, message, commandType);
  }

  categorizeCommand(message) {
    const lowerMessage = message.toLowerCase();
    
    // Build-related commands
    if (lowerMessage.includes('build') || lowerMessage.includes('create') || 
        lowerMessage.includes('make') || lowerMessage.includes('construct')) {
      return 'build';
    }
    
    // Give/item commands
    if (lowerMessage.includes('give') || lowerMessage.includes('item') || 
        lowerMessage.includes('diamond') || lowerMessage.includes('sword')) {
      return 'give';
    }
    
    // Teleport commands
    if (lowerMessage.includes('teleport') || lowerMessage.includes('tp') || 
        lowerMessage.includes('come') || lowerMessage.includes('here')) {
      return 'teleport';
    }
    
    // Gamemode commands
    if (lowerMessage.includes('gamemode') || lowerMessage.includes('creative') || 
        lowerMessage.includes('survival')) {
      return 'gamemode';
    }
    
    // Time commands
    if (lowerMessage.includes('time') || lowerMessage.includes('day') || 
        lowerMessage.includes('night')) {
      return 'time';
    }
    
    // Weather commands
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || 
        lowerMessage.includes('sun')) {
      return 'weather';
    }
    
    // Help commands
    if (lowerMessage.includes('help') || lowerMessage.includes('commands') || 
        lowerMessage.includes('what can you do')) {
      return 'help';
    }
    
    return 'general';
  }

  async executeCommands(commands, isAdmin) {
    for (const command of commands) {
      await this.executeCommand(command, isAdmin);
      // Small delay between commands to prevent spam
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async executeCommand(command, isAdmin) {
    const sanitizedCommand = this.sanitizeCommand(command, isAdmin);
    
    if (!sanitizedCommand) {
      console.log('❌ Command blocked by safety filter');
      return;
    }
    
    try {
      if (config.bot.debugMode) {
        console.log(`🎮 Executing: ${sanitizedCommand}`);
      }
      
      this.executeCommand(sanitizedCommand);
      this.commandHistory.push({
        command: sanitizedCommand,
        timestamp: new Date().toISOString(),
        isAdmin
      });
    } catch (error) {
      console.error('❌ Command execution error:', error);
    }
  }

  sanitizeCommand(command, isAdmin = false) {
    if (!command || typeof command !== 'string') return null;
    
    // Remove leading slash if present
    command = command.replace(/^\/+/, '');
    
    // Basic safety checks
    const lowerCommand = command.toLowerCase();
    const blockedCommands = ['stop', 'restart', 'ban', 'kick', 'whitelist', 'op', 'deop'];
    
    if (!isAdmin) {
      for (const blocked of blockedCommands) {
        if (lowerCommand.startsWith(blocked)) {
          return null;
        }
      }
    }
    
    return command;
  }

  start() {
    console.log('🤖 Starting Minecraft AI Admin Bot...');
    console.log(`🎮 Bot Name: ${config.server.botName}`);
    console.log(`🌐 Target Server: ${config.server.ip}:${config.server.port}`);
    console.log(`🧠 AI Model: ${config.ai.model}`);
    
    this.createBot();
  }
}

// Create and start the bot
const bot = new MinecraftAIBot();
bot.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  if (bot.client) {
    bot.client.disconnect();
  }
  process.exit(0);
});
