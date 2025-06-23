// Comprehensive Minecraft Bedrock Knowledge Base
// This ensures the AI only suggests items/commands that actually exist

export const MinecraftKnowledge = {
  // All valid Minecraft Bedrock items (most common ones kids ask for)
  items: {
    tools: [
      'diamond_sword', 'iron_sword', 'wooden_sword', 'stone_sword', 'golden_sword', 'netherite_sword',
      'diamond_pickaxe', 'iron_pickaxe', 'wooden_pickaxe', 'stone_pickaxe', 'golden_pickaxe', 'netherite_pickaxe',
      'diamond_axe', 'iron_axe', 'wooden_axe', 'stone_axe', 'golden_axe', 'netherite_axe',
      'diamond_shovel', 'iron_shovel', 'wooden_shovel', 'stone_shovel', 'golden_shovel', 'netherite_shovel',
      'diamond_hoe', 'iron_hoe', 'wooden_hoe', 'stone_hoe', 'golden_hoe', 'netherite_hoe',
      'bow', 'crossbow', 'trident', 'fishing_rod', 'flint_and_steel', 'shears', 'compass', 'clock'
    ],
    armor: [
      'diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots',
      'iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots',
      'golden_helmet', 'golden_chestplate', 'golden_leggings', 'golden_boots',
      'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
      'chainmail_helmet', 'chainmail_chestplate', 'chainmail_leggings', 'chainmail_boots',
      'netherite_helmet', 'netherite_chestplate', 'netherite_leggings', 'netherite_boots',
      'turtle_helmet', 'elytra', 'shield'
    ],
    blocks: [
      'stone', 'cobblestone', 'dirt', 'grass_block', 'sand', 'gravel', 'oak_log', 'oak_planks',
      'glass', 'wool', 'diamond_block', 'iron_block', 'gold_block', 'emerald_block',
      'obsidian', 'bedrock', 'water', 'lava', 'tnt', 'chest', 'furnace', 'crafting_table',
      'bed', 'door', 'fence', 'stairs', 'slab', 'torch', 'redstone', 'piston'
    ],
    food: [
      'apple', 'bread', 'cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_fish',
      'cake', 'cookie', 'golden_apple', 'enchanted_golden_apple', 'carrot', 'potato',
      'beetroot', 'melon', 'pumpkin_pie', 'mushroom_stew', 'rabbit_stew'
    ],
    special: [
      'diamond', 'emerald', 'gold_ingot', 'iron_ingot', 'coal', 'redstone_dust',
      'ender_pearl', 'blaze_rod', 'nether_star', 'dragon_egg', 'totem_of_undying',
      'experience_bottle', 'firework_rocket', 'name_tag', 'saddle', 'lead'
    ]
  },

  // Valid Minecraft Bedrock entities/mobs
  entities: [
    'pig', 'cow', 'chicken', 'sheep', 'horse', 'wolf', 'cat', 'ocelot', 'rabbit', 'fox', 'bee',
    'villager', 'iron_golem', 'snow_golem', 'zombie', 'skeleton', 'creeper', 'spider', 'enderman',
    'witch', 'zombie_villager', 'husk', 'stray', 'phantom', 'drowned', 'pillager', 'ravager',
    'evoker', 'vindicator', 'vex', 'blaze', 'ghast', 'zombie_pigman', 'wither_skeleton',
    'magma_cube', 'slime', 'silverfish', 'endermite', 'shulker', 'ender_dragon', 'wither'
  ],

  // Valid game modes
  gameModes: ['survival', 'creative', 'adventure', 'spectator'],

  // Valid weather types
  weather: ['clear', 'rain', 'thunder'],

  // Valid time settings
  timeSettings: ['day', 'night', 'noon', 'midnight'],

  // Common structure types kids might ask for
  structures: [
    'house', 'castle', 'tower', 'bridge', 'farm', 'stable', 'barn', 'garden',
    'playground', 'treehouse', 'fort', 'maze', 'pool', 'fountain', 'statue',
    'habitat', 'pen', 'enclosure', 'zoo', 'aquarium', 'museum'
  ],

  // Animal habitats and what animals go with them
  animalHabitats: {
    'farm': ['pig', 'cow', 'chicken', 'sheep', 'horse'],
    'forest': ['wolf', 'fox', 'rabbit', 'bee'],
    'jungle': ['ocelot', 'parrot'],
    'ocean': ['fish', 'dolphin', 'turtle'],
    'desert': ['camel', 'rabbit'],
    'arctic': ['polar_bear', 'fox'],
    'savanna': ['horse', 'llama']
  },

  // Valid Minecraft Bedrock commands (safe ones for kids)
  safeCommands: [
    'give', 'teleport', 'tp', 'gamemode', 'time', 'weather', 'fill', 'clone',
    'summon', 'kill', 'clear', 'effect', 'enchant', 'xp', 'experience',
    'setblock', 'replaceitem', 'title', 'tellraw', 'say'
  ],

  // Dangerous commands to never allow
  blockedCommands: [
    'op', 'deop', 'ban', 'kick', 'whitelist', 'stop', 'save-all', 'save-off',
    'difficulty', 'gamerule', 'worldborder', 'execute'
  ],

  // Fun building materials by category
  buildingMaterials: {
    colorful: ['wool', 'concrete', 'terracotta', 'stained_glass', 'carpet'],
    natural: ['wood', 'stone', 'dirt', 'sand', 'leaves', 'flowers'],
    fancy: ['quartz', 'prismarine', 'purpur', 'end_stone', 'nether_brick'],
    glowing: ['glowstone', 'sea_lantern', 'redstone_lamp', 'torch', 'lantern']
  }
};

// Helper functions to validate and suggest items
export class MinecraftValidator {
  static isValidItem(item) {
    const allItems = [
      ...MinecraftKnowledge.items.tools,
      ...MinecraftKnowledge.items.armor,
      ...MinecraftKnowledge.items.blocks,
      ...MinecraftKnowledge.items.food,
      ...MinecraftKnowledge.items.special
    ];
    return allItems.includes(item.toLowerCase());
  }

  static isValidEntity(entity) {
    return MinecraftKnowledge.entities.includes(entity.toLowerCase());
  }

  static isValidCommand(command) {
    return MinecraftKnowledge.safeCommands.includes(command.toLowerCase());
  }

  static isBlockedCommand(command) {
    return MinecraftKnowledge.blockedCommands.includes(command.toLowerCase());
  }

  static suggestSimilarItem(requestedItem) {
    const allItems = [
      ...MinecraftKnowledge.items.tools,
      ...MinecraftKnowledge.items.armor,
      ...MinecraftKnowledge.items.blocks,
      ...MinecraftKnowledge.items.food,
      ...MinecraftKnowledge.items.special
    ];
    
    // Simple fuzzy matching for common misspellings
    const similar = allItems.filter(item => 
      item.includes(requestedItem.toLowerCase()) || 
      requestedItem.toLowerCase().includes(item)
    );
    
    return similar.length > 0 ? similar[0] : null;
  }

  static getRandomItemFromCategory(category) {
    const items = MinecraftKnowledge.items[category];
    return items ? items[Math.floor(Math.random() * items.length)] : null;
  }

  static getBuildingMaterialsForType(type) {
    return MinecraftKnowledge.buildingMaterials[type] || [];
  }

  static getAnimalsForHabitat(habitat) {
    return MinecraftKnowledge.animalHabitats[habitat] || [];
  }
} 