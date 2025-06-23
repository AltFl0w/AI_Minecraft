import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server connection
  server: {
    ip: process.env.SERVER_IP || 'localhost',
    port: parseInt(process.env.PORT) || 19133,
    botName: process.env.BOT_NAME || 'AI_Admin'
  },

  // AI configuration
  ai: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-pro'
  },

  // Bot behavior
  bot: {
    adminUsers: process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(u => u.trim()) : [],
    commandCooldown: parseInt(process.env.COMMAND_COOLDOWN) || 500,
    maxBuildSize: parseInt(process.env.MAX_BUILD_SIZE) || 100,
    debugMode: process.env.DEBUG_MODE === 'true',
    autoReconnect: true,
    reconnectDelay: 5000
  },

  // Command permissions
  commands: {
    // Commands that don't require special permissions
    public: ['give', 'tp', 'teleport', 'gamemode', 'time', 'weather'],
    
    // Commands that require admin permission
    admin: ['fill', 'setblock', 'structure', 'gamerule', 'difficulty'],
    
    // Blocked commands for security
    blocked: ['op', 'deop', 'ban', 'kick', 'stop', 'restart', 'whitelist']
  },

  // Structure file settings
  structures: {
    directory: 'structures',
    maxSize: 50, // Max size in blocks for auto-generated structures
    
    // Predefined structure mappings for natural language
    aliases: {
      'bear': ['bear_habitat', 'bear_pen', 'bear_enclosure'],
      'lion': ['lion_habitat', 'lion_den', 'big_cat_enclosure'],
      'bird': ['aviary', 'bird_habitat', 'bird_cage'],
      'aquarium': ['fish_tank', 'water_habitat', 'aquatic_enclosure'],
      'reptile': ['reptile_habitat', 'snake_enclosure', 'lizard_habitat']
    }
  }
};

export function validateConfig() {
  const errors = [];

  if (!config.ai.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (!config.server.ip) {
    errors.push('SERVER_IP is required');
  }

  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  return errors;
}

export function isAdminUser(username) {
  if (config.bot.adminUsers.length === 0) {
    return true; // If no admin users specified, everyone is admin
  }
  return config.bot.adminUsers.includes(username);
}

export function isCommandAllowed(command, username, isAdmin = false) {
  const cmd = command.toLowerCase().split(' ')[0];
  
  // Check blocked commands
  if (config.commands.blocked.includes(cmd)) {
    return false;
  }
  
  // Check admin-only commands
  if (config.commands.admin.includes(cmd) && !isAdmin) {
    return false;
  }
  
  return true;
} 