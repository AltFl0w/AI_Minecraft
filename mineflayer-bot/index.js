import mineflayer from 'mineflayer';
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
    this.bot = null;
    this.commandHistory = [];
    this.structures = new Map();
    this.commandHandler = new CommandHandler(null, this.model); // Bot will be set later
    this.lastCommandTime = new Map(); // For cooldown tracking
    
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
    this.bot = mineflayer.createBot({
      host: config.server.ip,
      port: config.server.port,
      username: config.server.botName,
      version: false
    });

    // Update command handler with bot reference
    this.commandHandler.bot = this.bot;

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.bot.on('login', () => {
      console.log(`✓ Bot logged in as ${this.bot.username}`);
      console.log(`✓ Connected to ${config.server.ip}:${config.server.port}`);
      this.bot.chat('🤖 AI Admin Bot is online! Use @admin to interact with me.');
    });

    this.bot.on('error', (err) => {
      console.error('❌ Bot error:', err);
    });

    this.bot.on('end', (reason) => {
      console.log(`❌ Bot disconnected: ${reason}`);
      if (config.bot.autoReconnect) {
        console.log(`🔄 Reconnecting in ${config.bot.reconnectDelay / 1000} seconds...`);
        setTimeout(() => this.createBot(), config.bot.reconnectDelay);
      }
    });

    this.bot.on('chat', async (username, message) => {
      if (username === this.bot.username) return;
      
      await this.handleChatMessage(username, message);
    });

    this.bot.on('spawn', () => {
      console.log('✓ Bot spawned in world');
    });
  }

  async handleChatMessage(username, message) {
    // Skip if message is from the bot itself
    if (username === this.bot.username) return;
    
    // Check if message is directed at the bot
    const isDirectedAtBot = message.toLowerCase().includes('@admin') || 
                           message.toLowerCase().includes(this.bot.username.toLowerCase());
    
    if (!isDirectedAtBot) return;
    
    // Clean the message
    const cleanMessage = message.replace(/@admin/gi, '').trim();
    
    if (config.bot.debugMode) {
      console.log(`🎮 Kid ${username} said: "${cleanMessage}"`);
    }
    
    // Check cooldown
    if (this.isOnCooldown(username)) {
      this.bot.chat(`⏰ Hey ${username}! Please wait a moment before asking again! ✨`);
      return;
    }
    
    // Update cooldown
    this.updateCooldown(username);
    
    // Check if user is admin
    const isAdmin = config.isAdmin(username);
    
    // Friendly greeting response
    this.bot.chat(`👋 Hi ${username}! Let me help you with that! 🌟`);
    
    // Route to appropriate command handler using new knowledge-based system
    try {
      await this.processCommand(username, cleanMessage, isAdmin);
    } catch (error) {
      console.error(`❌ Error processing command:`, error);
      this.bot.chat(`🤖 Oops! Something went wrong, ${username}! Let me try to help you another way! 🔧`);
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
    
    return 'generic';
  }

  // Old command methods removed - now using unified knowledge-based handler

  async executeCommands(commands, isAdmin) {
    for (const command of commands) {
      await this.executeCommand(command.trim(), isAdmin);
      // Small delay between commands
      await new Promise(resolve => setTimeout(resolve, config.bot.commandCooldown));
    }
  }

  async executeCommand(command, isAdmin) {
    // Sanitize and validate command
    const sanitized = this.sanitizeCommand(command, isAdmin);
    if (!sanitized) return;

    if (config.bot.debugMode) {
      console.log(`⚡ Executing: ${sanitized}`);
    }
    
    this.bot.chat(`/${sanitized}`);
    
    // Store in history
    this.commandHistory.push({
      command: sanitized,
      timestamp: new Date(),
      isAdmin
    });

    // Keep history manageable
    if (this.commandHistory.length > 100) {
      this.commandHistory = this.commandHistory.slice(-50);
    }
  }

  sanitizeCommand(command, isAdmin = false) {
    // Remove leading slash if present
    command = command.replace(/^\/+/, '');
    
    const firstWord = command.split(' ')[0].toLowerCase();
    
    // Check if command is allowed
    if (!isCommandAllowed(command, 'system', isAdmin)) {
      console.log(`🚫 Blocked unsafe command: ${command} (admin: ${isAdmin})`);
      this.bot.chat(`🛡️ That command isn't safe for kids! Let's try something fun instead! ✨`);
      return null;
    }

    // Additional safety checks
    if (command.includes('..') || command.includes('\\')) {
      console.log(`🚫 Blocked potentially dangerous path: ${command}`);
      this.bot.chat(`🛡️ That doesn't look safe! Let's stick to fun Minecraft commands! ✨`);
      return null;
    }

    return command;
  }

  start() {
    console.log('🚀 Starting Minecraft AI Admin Bot...');
    console.log(`📡 Server: ${config.server.ip}:${config.server.port}`);
    console.log(`🤖 Bot Name: ${config.server.botName}`);
    console.log(`🧠 AI Model: ${config.ai.model}`);
    
    if (config.bot.adminUsers.length > 0) {
      console.log(`👑 Admin Users: ${config.bot.adminUsers.join(', ')}`);
    } else {
      console.log(`👑 Admin Users: All users (no restrictions)`);
    }
    
    this.createBot();
  }
}

// Start the bot
const aiBot = new MinecraftAIBot();
aiBot.start();
