import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptTranslator } from './prompt-translator.js';
import { MinecraftKnowledge, MinecraftValidator } from './minecraft-knowledge.js';

export class CommandHandler {
  constructor(bot, aiModel) {
    this.bot = bot;
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

  async handleCommand(username, message, commandType) {
    try {
      // Get player position for context
      const player = this.bot.players[username];
      const playerPosition = player ? player.entity?.position : null;

      // Pre-validate the request for safety
      const validation = this.promptTranslator.validateRequest(message);
      if (!validation.isValid) {
        this.bot.chat(`🚫 Oops ${username}! That's not something I can help with. Let's try something fun instead! 🎮`);
        return;
      }

      // Use the new prompt translator system
      const structuredPrompt = this.promptTranslator.translateMessage(
        message, 
        commandType, 
        username, 
        playerPosition
      );

      if (this.config.bot.debugMode) {
        console.log(`🧠 Generated structured prompt for ${username}:`, structuredPrompt.substring(0, 200) + '...');
      }

      // Get AI response with structured prompt
      const result = await this.model.generateContent(structuredPrompt);
      const response = result.response.text();

      // Parse the AI response
      const parsed = this.parseAIResponse(response);
      
      if (parsed.chat) {
        this.bot.chat(parsed.chat);
      }
      
      if (parsed.command) {
        // Final safety check on the command
        if (this.isCommandSafe(parsed.command)) {
          this.executeCommand(parsed.command, username);
        } else {
          this.bot.chat(`🛡️ That command isn't safe for kids, ${username}! Let's try something else fun! ✨`);
        }
      }

    } catch (error) {
      console.error(`❌ Error handling command for ${username}:`, error);
      this.bot.chat(`🤖 Oops! Something went wrong, ${username}! Let me try to help you another way! 🔧`);
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

  /**
   * Execute the validated command
   */
  executeCommand(command, username) {
    try {
      if (this.config.bot.debugMode) {
        console.log(`🎮 Executing command for ${username}: ${command}`);
      }
      
      this.bot.chat(`/${command}`);
    } catch (error) {
      console.error(`❌ Error executing command:`, error);
      this.bot.chat(`🔧 Something went wrong with that command, ${username}! Let's try something else! ✨`);
    }
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
      
      this.bot.chat(`🎁 Coming right up! ${response.includes('✨') ? '' : '✨'}`);
      
      if (response.startsWith('/give')) {
        return response;
      } else {
        return `/give ${username} diamond 1`;
      }
    } catch (error) {
      console.error('❌ Give command error:', error);
      this.bot.chat("🎁 Oops! Let me get you something awesome instead! ✨");
      return `/give ${username} diamond 1`;
    }
  }

  async handleTeleportCommand(username, message) {
    const msg = message.toLowerCase();
    
    // Handle common teleport patterns directly
    if (msg.includes('come here') || msg.includes('come to me')) {
      return `tp ${this.bot.username} ${username}`;
    }
    
    if (msg.includes('spawn')) {
      return `tp ${username} 0 70 0`;
    }

    // Use AI for complex teleport requests
    const prompt = `Convert this teleport request to a Minecraft command: "${message}"
    
    Player requesting: ${username}
    Bot name: ${this.bot.username}
    
    Rules:
    - Use /tp commands
    - If they want bot to come to them: tp ${this.bot.username} ${username}
    - If they want to go somewhere: tp ${username} [coordinates or location]
    - Common locations: spawn (0 70 0), sky (~ 200 ~), underground (~ 10 ~)
    - Only return the command, no explanation
    
    Examples:
    "come here" -> tp ${this.bot.username} ${username}
    "tp me to spawn" -> tp ${username} 0 70 0
    "take me up high" -> tp ${username} ~ 200 ~`;

    try {
      const result = await this.aiModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('AI Error in teleport command:', error);
      return `tp ${this.bot.username} ${username}`; // Fallback
    }
  }

  handleGamemodeCommand(username, message) {
    const msg = message.toLowerCase();
    let gamemode = 'survival';
    
    if (msg.includes('creative')) gamemode = 'creative';
    else if (msg.includes('adventure')) gamemode = 'adventure';
    else if (msg.includes('spectator')) gamemode = 'spectator';
    
    return `gamemode ${gamemode} ${username}`;
  }

  handleTimeCommand(username, message) {
    const msg = message.toLowerCase();
    let time = 'day';
    
    if (msg.includes('night') || msg.includes('dark')) time = 'night';
    else if (msg.includes('noon') || msg.includes('mid')) time = 'noon';
    else if (msg.includes('midnight')) time = 'midnight';
    else if (msg.includes('sunrise') || msg.includes('dawn')) time = 'sunrise';
    else if (msg.includes('sunset') || msg.includes('dusk')) time = 'sunset';
    
    return `time set ${time}`;
  }

  handleWeatherCommand(username, message) {
    const msg = message.toLowerCase();
    let weather = 'clear';
    
    if (msg.includes('rain') || msg.includes('storm')) weather = 'rain';
    else if (msg.includes('thunder')) weather = 'thunder';
    else if (msg.includes('clear') || msg.includes('sunny')) weather = 'clear';
    
    return `weather ${weather}`;
  }

  async handleBuildCommand(username, message, structures) {
    // First check for structure matches
    const structureMatch = this.findStructureMatch(message, structures);
    if (structureMatch) {
      return {
        type: 'structure',
        structure: structureMatch,
        message: `Building ${structureMatch} structure for you!`
      };
    }

    // Use AI for custom builds
    const availableStructures = Array.from(structures.keys()).join(', ');
    const prompt = `
${this.childSafeContext}

🏗️ BUILD COMMAND HELPER 🏗️

A kid named ${username} wants to build something in Minecraft! This is so exciting! 🌟

What they said: "${message}"
Their position: x:${structures.get(structureMatch).x}, y:${structures.get(structureMatch).y}, z:${structures.get(structureMatch).z}

AVAILABLE STRUCTURES IN /structures FOLDER:
${this.config.getStructureAliases().map(alias => `- ${alias}`).join('\n')}

YOUR JOB:
1. Figure out what structure matches their request (be creative with matching!)
2. Choose a good spot near them to build it
3. Be super encouraging about their building idea!

BUILDING RULES:
- Build near the player (within 10 blocks)
- Choose safe, flat ground when possible
- Make it sound exciting and fun!
- If no perfect match, pick the closest fun structure

Examples:
"build a house" → house, cabin, or home structure
"make a farm" → farm, barn, or animal structure  
"build something for bears" → bear_habitat, bear_pen
"create a castle" → castle, tower, or fortress

Respond with ONLY the structure command:
/structure load [structure_name] ${Math.floor(structures.get(structureMatch).x + Math.random() * 10 - 5)} ${Math.floor(structures.get(structureMatch).y)} ${Math.floor(structures.get(structureMatch).z + Math.random() * 10 - 5)}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      this.bot.chat(`🏗️ Great building idea! Let me create something awesome for you! ✨`);
      
      if (response.includes('/structure load')) {
        return response;
      } else {
        // Fallback to a simple house structure
        const x = Math.floor(structures.get(structureMatch).x + 5);
        const y = Math.floor(structures.get(structureMatch).y);
        const z = Math.floor(structures.get(structureMatch).z + 5);
        return `/structure load house ${x} ${y} ${z}`;
      }
    } catch (error) {
      console.error('❌ Build command error:', error);
      this.bot.chat("🏗️ Let me build you something super cool! 🌟");
      const x = Math.floor(structures.get(structureMatch).x + 5);
      const y = Math.floor(structures.get(structureMatch).y);
      const z = Math.floor(structures.get(structureMatch).z + 5);
      return `/structure load house ${x} ${y} ${z}`;
    }
  }

  findStructureMatch(message, structures) {
    const msg = message.toLowerCase();
    
    // Direct filename matches (without extension)
    for (const [name, file] of structures) {
      if (msg.includes(name)) {
        return name;
      }
    }
    
    // Check aliases
    for (const [alias, structureNames] of Object.entries(config.structures.aliases)) {
      if (msg.includes(alias)) {
        // Find the first matching structure file
        for (const structureName of structureNames) {
          if (structures.has(structureName)) {
            return structureName;
          }
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

COMMON MINECRAFT COMMANDS:
- /gamemode creative (for building freely)
- /gamemode survival (for adventure mode)
- /time set day (make it sunny!)
- /weather clear (stop the rain)
- /tp [player] [x] [y] [z] (teleport somewhere)
- /effect give [player] minecraft:speed 30 1 (make them fast!)
- /effect give [player] minecraft:jump_boost 30 1 (make them jump high!)

YOUR JOB:
1. Understand what the kid wants to do
2. Give them the right Minecraft command
3. Make it sound fun and encouraging!
4. If unsure, ask them to be more specific in a friendly way

SAFETY RULES:
- No dangerous commands (like /kill)
- Keep effects short and fun (30 seconds max)
- Use reasonable coordinates for teleporting
- Always be encouraging!

If it's not a command request, just be friendly and helpful!

Respond with either:
- A Minecraft command: /[command]
- A friendly response if no command needed
`;

      const result = await this.model.generateContent(prompt);
      let response = result.response.text().trim();
      
      // Add encouraging emoji if not present
      if (!response.includes('✨') && !response.includes('🎮') && !response.includes('😊')) {
        response += ' ✨';
      }
      
      this.bot.chat(`🎮 ${response}`);
      
      // Check if response contains a command
      if (response.includes('/')) {
        const commandMatch = response.match(/\/\w+[^✨🎮😊]*/);
        return commandMatch ? commandMatch[0].trim() : null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Generic command error:', error);
      this.bot.chat("🎮 I'm here to help make Minecraft super fun! Can you tell me more about what you'd like to do? ✨");
      return null;
    }
  }

  // Utility method to validate build size
  validateBuildSize(commands) {
    const maxSize = config.bot.maxBuildSize;
    
    for (const command of commands) {
      if (command.includes('fill')) {
        // Basic size validation for fill commands
        const coords = command.match(/~?-?\d+/g);
        if (coords && coords.length >= 6) {
          const [x1, y1, z1, x2, y2, z2] = coords.map(c => Math.abs(parseInt(c.replace('~', '')) || 0));
          const volume = Math.abs(x2 - x1) * Math.abs(y2 - y1) * Math.abs(z2 - z1);
          
          if (volume > maxSize) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
} 