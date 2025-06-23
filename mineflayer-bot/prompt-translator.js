// Pre-defined Prompt Translator System
// Converts kid's messages into structured prompts with Minecraft knowledge

import { MinecraftKnowledge, MinecraftValidator } from './minecraft-knowledge.js';

export class PromptTranslator {
  constructor() {
    this.childSafeContext = `
🎮 MINECRAFT AI ASSISTANT FOR KIDS 🎮

You are a super friendly Minecraft helper talking to a child! Always be:
- Kind, encouraging, and patient like a helpful big sibling
- Use simple words that kids understand  
- Make everything sound fun and exciting with emojis! ✨
- Be positive and never say "no" - instead suggest fun alternatives!
- If something isn't possible, redirect to something cool they CAN do!

SAFETY RULES:
- NEVER suggest items that don't exist in Minecraft Bedrock
- ONLY use commands from the safe command list provided
- If asked for something inappropriate, suggest a fun Minecraft activity instead
- Always validate items/entities against the knowledge base before suggesting them
`;
  }

  /**
   * Main translation function - converts kid's message to structured AI prompt
   */
  translateMessage(childMessage, commandType, playerName, playerPosition = null) {
    // Step 1: Analyze what the kid is asking for
    const analysis = this.analyzeRequest(childMessage, commandType);
    
    // Step 2: Build context with relevant Minecraft knowledge
    const minecraftContext = this.buildMinecraftContext(analysis);
    
    // Step 3: Create structured prompt with extended thinking
    const structuredPrompt = this.createStructuredPrompt(
      childMessage, 
      analysis, 
      minecraftContext, 
      playerName, 
      playerPosition
    );
    
    return structuredPrompt;
  }

  /**
   * Analyze what the child is requesting
   */
  analyzeRequest(message, commandType) {
    const lowerMessage = message.toLowerCase();
    
    return {
      type: commandType,
      containsItems: this.extractItems(lowerMessage),
      containsAnimals: this.extractAnimals(lowerMessage),
      containsStructures: this.extractStructures(lowerMessage),
      containsColors: this.extractColors(lowerMessage),
      containsNumbers: this.extractNumbers(lowerMessage),
      sentiment: this.analyzeSentiment(lowerMessage),
      urgency: this.analyzeUrgency(lowerMessage)
    };
  }

  /**
   * Extract mentioned items and validate them
   */
  extractItems(message) {
    const mentionedItems = [];
    const allItems = [
      ...MinecraftKnowledge.items.tools,
      ...MinecraftKnowledge.items.armor,
      ...MinecraftKnowledge.items.blocks,
      ...MinecraftKnowledge.items.food,
      ...MinecraftKnowledge.items.special
    ];

    // Check for exact matches
    allItems.forEach(item => {
      if (message.includes(item.replace('_', ' ')) || message.includes(item)) {
        mentionedItems.push(item);
      }
    });

    // Check for common kid terms and map them
    const kidTerms = {
      'sword': 'diamond_sword',
      'pickaxe': 'diamond_pickaxe', 
      'diamonds': 'diamond',
      'food': 'bread',
      'armor': 'diamond_chestplate',
      'helmet': 'diamond_helmet',
      'boots': 'diamond_boots'
    };

    Object.keys(kidTerms).forEach(term => {
      if (message.includes(term)) {
        mentionedItems.push(kidTerms[term]);
      }
    });

    return [...new Set(mentionedItems)]; // Remove duplicates
  }

  /**
   * Extract mentioned animals/entities
   */
  extractAnimals(message) {
    return MinecraftKnowledge.entities.filter(entity => 
      message.includes(entity) || message.includes(entity + 's')
    );
  }

  /**
   * Extract structure types
   */
  extractStructures(message) {
    return MinecraftKnowledge.structures.filter(structure => 
      message.includes(structure)
    );
  }

  /**
   * Extract colors mentioned
   */
  extractColors(message) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'white', 'black', 'gray', 'brown'];
    return colors.filter(color => message.includes(color));
  }

  /**
   * Extract numbers for quantities
   */
  extractNumbers(message) {
    const numbers = message.match(/\d+/g);
    return numbers ? numbers.map(n => parseInt(n)) : [];
  }

  /**
   * Analyze the child's sentiment/mood
   */
  analyzeSentiment(message) {
    if (message.includes('please') || message.includes('help')) return 'polite';
    if (message.includes('!') || message.includes('awesome') || message.includes('cool')) return 'excited';
    if (message.includes('can you') || message.includes('could you')) return 'questioning';
    return 'neutral';
  }

  /**
   * Check if request seems urgent
   */
  analyzeUrgency(message) {
    const urgentWords = ['quick', 'fast', 'now', 'urgent', 'help!', 'emergency'];
    return urgentWords.some(word => message.includes(word));
  }

  /**
   * Build relevant Minecraft context based on analysis
   */
  buildMinecraftContext(analysis) {
    let context = "\n📚 MINECRAFT KNOWLEDGE BASE:\n";
    
    // Add relevant item categories
    if (analysis.type === 'give' || analysis.containsItems.length > 0) {
      context += `
🎒 VALID ITEMS YOU CAN GIVE:
Tools: ${MinecraftKnowledge.items.tools.slice(0, 10).join(', ')}...
Armor: ${MinecraftKnowledge.items.armor.slice(0, 8).join(', ')}...
Blocks: ${MinecraftKnowledge.items.blocks.slice(0, 10).join(', ')}...
Food: ${MinecraftKnowledge.items.food.slice(0, 8).join(', ')}...
Special: ${MinecraftKnowledge.items.special.slice(0, 8).join(', ')}...
`;
    }

    // Add animal context for summon/build commands
    if (analysis.type === 'build' || analysis.containsAnimals.length > 0) {
      context += `
🐾 ANIMALS YOU CAN SUMMON:
Farm Animals: ${MinecraftKnowledge.animalHabitats.farm.join(', ')}
Forest Animals: ${MinecraftKnowledge.animalHabitats.forest.join(', ')}
All Valid Entities: ${MinecraftKnowledge.entities.slice(0, 15).join(', ')}...
`;
    }

    // Add building materials for build commands
    if (analysis.type === 'build') {
      context += `
🏗️ BUILDING MATERIALS:
Colorful: ${MinecraftKnowledge.buildingMaterials.colorful.join(', ')}
Natural: ${MinecraftKnowledge.buildingMaterials.natural.join(', ')}
Fancy: ${MinecraftKnowledge.buildingMaterials.fancy.join(', ')}
Glowing: ${MinecraftKnowledge.buildingMaterials.glowing.join(', ')}
`;
    }

    // Add safe commands
    context += `
✅ SAFE COMMANDS YOU CAN USE: ${MinecraftKnowledge.safeCommands.join(', ')}
❌ NEVER USE THESE BLOCKED COMMANDS: ${MinecraftKnowledge.blockedCommands.join(', ')}
`;

    return context;
  }

  /**
   * Create the final structured prompt with extended thinking
   */
  createStructuredPrompt(originalMessage, analysis, minecraftContext, playerName, playerPosition) {
    return `${this.childSafeContext}

${minecraftContext}

🧠 EXTENDED THINKING PROCESS:
A child named "${playerName}" said: "${originalMessage}"

STEP 1 - UNDERSTAND THE REQUEST:
- Command Type: ${analysis.type}
- Items Mentioned: ${analysis.containsItems.length > 0 ? analysis.containsItems.join(', ') : 'none'}
- Animals Mentioned: ${analysis.containsAnimals.length > 0 ? analysis.containsAnimals.join(', ') : 'none'}  
- Structures Mentioned: ${analysis.containsStructures.length > 0 ? analysis.containsStructures.join(', ') : 'none'}
- Child's Mood: ${analysis.sentiment}
- Numbers: ${analysis.containsNumbers.length > 0 ? analysis.containsNumbers.join(', ') : 'none'}

STEP 2 - VALIDATE AGAINST MINECRAFT KNOWLEDGE:
- Check if all mentioned items exist in Minecraft Bedrock
- Verify all entities are valid  
- Ensure commands are safe for children
- If something doesn't exist, suggest similar valid alternatives

STEP 3 - SAFETY CHECK:
- Is this request safe and appropriate for a child?
- Are all items/commands in the allowed lists?
- Would this be fun and educational?

STEP 4 - CREATE RESPONSE:
Based on the analysis above, provide:
1. A friendly response to the child (using their name "${playerName}")
2. The exact Minecraft command(s) to execute
3. If the request can't be fulfilled exactly, suggest something similar and fun!

REMEMBER: 
- Only use items from the knowledge base above
- Only use safe commands from the allowed list
- Make it sound exciting and fun!
- If something isn't possible, redirect to something awesome they CAN do!

Your response should be in this format:
CHAT: [Friendly message to the child]
COMMAND: [Exact minecraft command to run]

Now process this request:`;
  }

  /**
   * Quick validation helper
   */
  validateRequest(message) {
    const issues = [];
    
    // Check for blocked commands
    MinecraftKnowledge.blockedCommands.forEach(cmd => {
      if (message.toLowerCase().includes(cmd)) {
        issues.push(`Contains blocked command: ${cmd}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
} 