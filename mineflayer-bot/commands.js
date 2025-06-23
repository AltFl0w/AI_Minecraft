import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptTranslator } from './prompt-translator.js';
import { MinecraftKnowledge, MinecraftValidator } from './minecraft-knowledge.js';

export class CommandHandler {
  constructor(client, aiModel) {
    this.bot = client;
    this.aiModel = aiModel;
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
    
    // Initialize the new prompt translator system
    this.promptTranslator = new PromptTranslator();
    
    // Child-friendly base context for all AI interactions
    this.childSafeContext = `
🎮 MINECRAFT AI ASSISTANT FOR KIDS 🎮

You are a super friendly Minecraft helper talking to a child! Always be:
- Kind, encouraging, and patient like a helpful big sibling
- Use simple words that kids understand
- Make everything sound fun and exciting with emojis! ✨
- Be positive and supportive - kids are learning!
- If something seems inappropriate, redirect to fun Minecraft activities
- Remember: You're helping make their Minecraft adventure amazing!

SAFETY RULES:
- Keep all responses child-appropriate and positive
- Use encouraging language that builds confidence
- Make mistakes sound like learning opportunities
- Focus on creativity and fun, not competition
- If asked about real-world info, redirect to Minecraft fun

Examples of great responses:
"Can you give me diamonds?" → "Absolutely! Let's get you some sparkly diamonds! ✨💎"
"I don't know what to do" → "No worries! There are so many fun things we can do in Minecraft! 🌟"
"Build me something cool" → "Great idea! Let's build something super awesome together! 🏗️"
`;
  }

  // Helper method to send chat messages
  sendChat(message) {
    if (!this.bot) return;
    
    try {
      this.bot.write('text', {
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
  executeCommand(command, username) {
    if (!this.bot) return;
    
    try {
      // Remove leading slash if present
      const cleanCommand = command.replace(/^\/+/, '');
      
      this.bot.write('command_request', {
        command: cleanCommand,
        origin: {
          type: 'player',
          uuid: '',
          request_id: ''
        },
        internal: false,
        version: 1
      });
      
      if (config.bot.debugMode) {
        console.log(`🎮 Executed command for ${username}: /${cleanCommand}`);
      }
    } catch (error) {
      console.error('Error executing command:', error);
      this.sendChat(`🔧 Something went wrong with that command, ${username}! Let's try something else! ✨`);
    }
  }

  async handleCommand(username, message, commandType) {
    try {
      // Get player position for context (bedrock-protocol doesn't have easy player access like mineflayer)
      const playerPosition = null; // We'll handle this differently in bedrock

      // Pre-validate the request for safety
      const validation = this.promptTranslator.validateRequest(message);
      if (!validation.isValid) {
        this.sendChat(`🚫 Oops ${username}! That's not something I can help with. Let's try something fun instead! 🎮`);
        return;
      }

      // Use the new prompt translator system
      const structuredPrompt = this.promptTranslator.translateMessage(
        message, 
        commandType, 
        username, 
        playerPosition
      );

      if (config.bot.debugMode) {
        console.log(`🧠 Generated structured prompt for ${username}:`, structuredPrompt.substring(0, 200) + '...');
      }

      // Get AI response with structured prompt
      const result = await this.model.generateContent(structuredPrompt);
      const response = result.response.text();

      // Parse the AI response
      const parsed = this.parseAIResponse(response);
      
      if (parsed.chat) {
        this.sendChat(parsed.chat);
      }
      
      if (parsed.command) {
        // Final safety check on the command
        if (this.isCommandSafe(parsed.command)) {
          this.executeCommand(parsed.command, username);
        } else {
          this.sendChat(`🛡️ That command isn't safe for kids, ${username}! Let's try something else fun! ✨`);
        }
      }

    } catch (error) {
      console.error(`❌ Error handling command for ${username}:`, error);
      this.sendChat(`🤖 Oops! Something went wrong, ${username}! Let me try to help you another way! 🔧`);
    }
  }

  /**
   * Parse AI response into chat message and command
   */
  parseAIResponse(response) {
    const lines = response.split('\n');
    let chat = '';
    let command = '';

    for (const line of lines) {
      if (line.startsWith('CHAT:')) {
        chat = line.replace('CHAT:', '').trim();
      } else if (line.startsWith('COMMAND:')) {
        command = line.replace('COMMAND:', '').trim();
      }
    }

    // Fallback if format isn't followed
    if (!chat && !command) {
      chat = response.trim();
    }

    return { chat, command };
  }

  /**
   * Enhanced safety check using knowledge base
   */
  isCommandSafe(command) {
    const lowerCommand = command.toLowerCase();
    
    // Check against blocked commands
    for (const blocked of MinecraftKnowledge.blockedCommands) {
      if (lowerCommand.includes(blocked)) {
        return false;
      }
    }

    // Ensure it starts with a safe command
    const firstWord = lowerCommand.split(' ')[0];
    if (!MinecraftKnowledge.safeCommands.includes(firstWord)) {
      return false;
    }

    return true;
  }

  async handleGiveCommand(username, message) {
    try {
      const prompt = `
${this.childSafeContext}

🎁 GIVE COMMAND HELPER 🎁

A kid named ${username} wants items in Minecraft! Help them by giving the right /give command.

What they said: "${message}"

MINECRAFT ITEMS YOU CAN GIVE:
- Blocks: dirt, stone, wood, glass, wool (any color)
- Tools: wooden_sword, iron_pickaxe, diamond_axe, bow
- Food: bread, apple, cooked_beef, cookie, cake
- Fun items: fireworks, painting, music_disc
- Building: bricks, planks, stairs, doors, windows

RULES:
- Give reasonable amounts (1-64 items)
- Use correct Minecraft item names (use _ not spaces)
- Be encouraging and excited about their request!
- If they ask for something that doesn't exist, suggest something similar and fun

Respond with ONLY the /give command, nothing else:
/give ${username} [item_name] [amount]
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      this.sendChat(`🎁 Coming right up! ${response.includes('✨') ? '' : '✨'}`);
      
      if (response.startsWith('/give')) {
        return response;
      } else {
        return `/give ${username} diamond 1`;
      }
    } catch (error) {
      console.error('❌ Give command error:', error);
      this.sendChat("🎁 Oops! Let me get you something awesome instead! ✨");
      return `/give ${username} diamond 1`;
    }
  }

  async handleTeleportCommand(username, message) {
    try {
      const prompt = `
${this.childSafeContext}

🚀 TELEPORT COMMAND HELPER 🚀

A kid named ${username} wants to teleport in Minecraft! Help them with the right command.

What they said: "${message}"

TELEPORT OPTIONS:
- To spawn: /tp ${username} 0 64 0
- To a player: /tp ${username} [player_name]
- To coordinates: /tp ${username} [x] [y] [z]

RULES:
- Keep coordinates reasonable (not too far from spawn)
- Y coordinate should be at least 60 (above ground)
- Be encouraging about their teleport request!

Respond with ONLY the /tp command, nothing else:
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      this.sendChat(`🚀 Teleporting you somewhere awesome! ✨`);
      
      if (response.startsWith('/tp')) {
        return response;
      } else {
        return `/tp ${username} 0 64 0`;
      }
    } catch (error) {
      console.error('❌ Teleport command error:', error);
      this.sendChat("🚀 Let me teleport you to spawn! ✨");
      return `/tp ${username} 0 64 0`;
    }
  }

  handleGamemodeCommand(username, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('creative')) {
      this.sendChat(`🎨 Switching you to Creative mode for unlimited building! ✨`);
      return `/gamemode creative ${username}`;
    } else if (lowerMessage.includes('survival')) {
      this.sendChat(`⚔️ Switching you to Survival mode for adventure! ✨`);
      return `/gamemode survival ${username}`;
    } else {
      this.sendChat(`🎮 Which gamemode would you like? Creative or Survival? ✨`);
      return null;
    }
  }

  handleTimeCommand(username, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('day') || lowerMessage.includes('morning')) {
      this.sendChat(`☀️ Making it a beautiful day! ✨`);
      return `/time set day`;
    } else if (lowerMessage.includes('night') || lowerMessage.includes('evening')) {
      this.sendChat(`🌙 Setting it to peaceful night time! ✨`);
      return `/time set night`;
    } else {
      this.sendChat(`🕐 Would you like it to be day or night? ✨`);
      return null;
    }
  }

  handleWeatherCommand(username, message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('clear') || lowerMessage.includes('sun')) {
      this.sendChat(`☀️ Clearing up the weather for you! ✨`);
      return `/weather clear`;
    } else if (lowerMessage.includes('rain')) {
      this.sendChat(`🌧️ Making it rain! ✨`);
      return `/weather rain`;
    } else {
      this.sendChat(`🌤️ Would you like sunny or rainy weather? ✨`);
      return null;
    }
  }

  async handleBuildCommand(username, message, structures) {
    try {
      const prompt = `
${this.childSafeContext}

🏗️ BUILD COMMAND HELPER 🏗️

A kid named ${username} wants to build something in Minecraft!

What they said: "${message}"

Available structures: ${structures ? Array.from(structures.keys()).join(', ') : 'house, castle, tower, bridge'}

BUILDING RULES:
- Keep builds reasonable size (max 50x50x50 blocks)
- Use safe, child-friendly designs
- Be encouraging about their creativity!
- If they want something not available, suggest alternatives

Generate a series of /fill or /setblock commands to create their requested build.
Keep it simple and fun!

Respond with up to 10 commands, one per line:
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      this.sendChat(`🏗️ Building something awesome for you! This might take a moment! ✨`);
      
      // Parse commands from response
      const commands = response.split('\n')
        .filter(line => line.trim().startsWith('/'))
        .slice(0, 10); // Limit to 10 commands for safety
      
      return commands;
    } catch (error) {
      console.error('❌ Build command error:', error);
      this.sendChat("🏗️ Let me build you a simple house instead! ✨");
      return [
        `/fill ~-2 ~-1 ~-2 ~2 ~3 ~2 cobblestone hollow`,
        `/setblock ~ ~3 ~ torch`
      ];
    }
  }

  findStructureMatch(message, structures) {
    if (!structures || structures.size === 0) return null;
    
    const lowerMessage = message.toLowerCase();
    
    for (const [name, file] of structures.entries()) {
      if (lowerMessage.includes(name)) {
        return { name, file };
      }
    }
    
    // Check for partial matches
    for (const [name, file] of structures.entries()) {
      const words = name.split(/[_\s-]+/);
      for (const word of words) {
        if (word.length > 3 && lowerMessage.includes(word)) {
          return { name, file };
        }
      }
    }
    
    return null;
  }

  async handleGenericCommand(username, message) {
    try {
      const prompt = `
${this.childSafeContext}

🎮 GENERAL MINECRAFT HELPER 🎮

A kid named ${username} needs help with something in Minecraft!

What they said: "${message}"

AVAILABLE COMMANDS:
- /give [player] [item] [amount] - Give items
- /tp [player] [location] - Teleport
- /gamemode [creative/survival] [player] - Change gamemode  
- /time set [day/night] - Change time
- /weather [clear/rain] - Change weather
- /fill [coords] [block] - Build with blocks
- /setblock [coords] [block] - Place single block

RULES:
- Only use safe, child-friendly commands
- Be encouraging and positive
- If unsure, ask for clarification
- Keep everything fun and creative!

Respond in this format:
CHAT: [Encouraging message to the child]
COMMAND: [Single Minecraft command to help them]

If you need more info, just respond with CHAT only.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('❌ Generic command error:', error);
      return {
        chat: `🤖 I'm here to help, ${username}! What would you like to do in Minecraft? ✨`,
        command: null
      };
    }
  }

  validateBuildSize(commands) {
    // Simple validation to prevent massive builds
    for (const command of commands) {
      if (command.includes('fill')) {
        const numbers = command.match(/-?\d+/g);
        if (numbers && numbers.length >= 6) {
          const [x1, y1, z1, x2, y2, z2] = numbers.map(Number);
          const sizeX = Math.abs(x2 - x1);
          const sizeY = Math.abs(y2 - y1);
          const sizeZ = Math.abs(z2 - z1);
          
          if (sizeX > 50 || sizeY > 50 || sizeZ > 50) {
            return false;
          }
        }
      }
    }
    return true;
  }
} 