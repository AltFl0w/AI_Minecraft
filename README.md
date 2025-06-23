# 🤖 Minecraft AI Admin Bot

A **child-friendly** Minecraft Bedrock AI Admin Bot that connects to Bedrock Dedicated Servers using GeyserMC and Floodgate. The bot uses Google's Gemini AI with a comprehensive **Minecraft knowledge base** to interpret natural language commands safely and accurately.

## 🌟 **NEW: Enhanced AI Knowledge System**

This bot now features a **revolutionary knowledge-based AI system** that:

- ✅ **Prevents AI hallucinations** by grounding all responses in actual Minecraft data
- 🧠 **Uses comprehensive Minecraft knowledge base** with all items, blocks, and commands  
- 🎯 **Pre-defined prompt translation** that converts kid's messages into structured AI prompts
- 👶 **Child-friendly language** designed specifically for young players
- 🛡️ **Enhanced safety** with content filtering and positive reinforcement

## 🚀 **Key Features**

### **🧠 Smart AI System**
- **Knowledge-Grounded**: AI responses based on actual Minecraft Bedrock data
- **Child-Safe Prompting**: Specially designed prompts for kids aged 6-12
- **Extended Thinking**: Multi-step AI reasoning for better command interpretation
- **Safety-First**: Redirects inappropriate requests to fun alternatives

### **🎮 Natural Language Commands**
- **"Give me diamonds!"** → `/give @p diamond 5`
- **"Build me a castle!"** → Generates appropriate build commands
- **"Make it daytime!"** → `/time set day`
- **"I'm hungry!"** → `/give @p bread 10`

### **🏗️ Structure Building**
- Load custom `.mcstructure` files
- Natural language matching ("bear" finds bear_habitat.mcstructure)
- Position-aware building near requesting player

### **🛡️ Advanced Security**
- Admin permission system with configurable user lists
- Command sanitization and validation  
- Build size limits to prevent griefing
- Blocked dangerous commands (op, ban, kick, etc.)

## 📁 **Project Structure**

```
ai-admin-bot-github/
├── mineflayer-bot/
│   ├── index.js              # Main bot with child-friendly responses
│   ├── commands.js           # Legacy command handlers (being phased out)
│   ├── config.js             # Configuration and security settings
│   ├── minecraft-knowledge.js # 🆕 Comprehensive Minecraft knowledge base
│   └── prompt-translator.js  # 🆕 Kid-to-AI prompt translation system
├── structures/
│   ├── README.md            # Structure file documentation
│   └── *.mcstructure       # Custom structure files
├── .env.example            # Environment configuration template
├── package.json           # Dependencies and scripts
└── Dockerfile            # Container deployment
```

## 🆕 **New Knowledge-Based System**

### **1. Minecraft Knowledge Base (`minecraft-knowledge.js`)**
Contains comprehensive data about:
- **Items**: All tools, blocks, food, weapons (400+ items)
- **Commands**: Valid Bedrock commands with syntax
- **Entities**: Mobs, animals, NPCs
- **Validation**: Functions to check if items/commands exist
- **Aliases**: Natural language mappings ("food" → bread, apple, etc.)

### **2. Prompt Translator (`prompt-translator.js`)**
Converts kid messages through structured thinking:

```javascript
Kid says: "I want a sword!"
↓
Prompt Translator creates structured prompt with:
- Child-safe context
- Minecraft knowledge base
- Safety guidelines  
- Example responses
↓
Gemini AI processes with full context
↓
Returns: "/give @p diamond_sword 1" + encouraging message
```

### **3. Enhanced Safety Features**
- **Content filtering** for inappropriate requests
- **Positive reinforcement** instead of saying "no"
- **Educational responses** that teach Minecraft concepts
- **Fallback suggestions** when requests aren't possible

## ⚙️ **Setup Instructions**

### **1. Environment Configuration**
Copy `.env.example` to `.env` and configure:

```bash
# Server Connection
MINECRAFT_HOST=your-server-ip
MINECRAFT_PORT=19132
MINECRAFT_USERNAME=AI_Admin
MINECRAFT_VERSION=1.20.0

# AI Configuration  
GEMINI_API_KEY=your-gemini-api-key

# Bot Settings
BOT_DEBUG=false
COMMAND_COOLDOWN=3000
ADMIN_USERS=admin1,admin2

# Child Safety
CHILD_SAFE_MODE=true
MAX_BUILD_SIZE=100
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Add Structure Files** (Optional)
Place `.mcstructure` files in the `structures/` directory:
```
structures/
├── bear_habitat.mcstructure
├── castle.mcstructure  
└── playground.mcstructure
```

### **4. Run the Bot**
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## 🗣️ **How Kids Can Talk to the Bot**

### **Natural Language Examples:**
- **"@admin give me diamonds!"**
- **"@admin I'm hungry, can I have food?"**
- **"@admin build me a cool house!"**
- **"@admin make it sunny!"**
- **"@admin can you come here?"**
- **"@admin help me!"**

### **The Bot Responds Like:**
- **"🎁 Here are some shiny diamonds for you! Have fun building!"**
- **"🍞 I got you some yummy food! Enjoy your meal!"**
- **"🏠 Building you an awesome house! This is going to be so cool!"**

## 🔧 **Technical Architecture**

### **AI Processing Flow:**
1. **Message Detection**: Checks for @admin mentions
2. **Command Categorization**: Identifies request type (build, give, etc.)
3. **Knowledge Lookup**: Validates against Minecraft database
4. **Prompt Translation**: Converts to structured AI prompt
5. **Gemini Processing**: AI generates response with full context
6. **Safety Validation**: Ensures command is safe and appropriate
7. **Execution**: Runs command and sends child-friendly response

### **Safety Layers:**
- **Input Sanitization**: Cleans and validates all user input
- **Command Whitelist**: Only allows safe Minecraft commands
- **Admin Permissions**: Restricts dangerous commands to admins
- **Content Filtering**: Blocks inappropriate content
- **Build Limits**: Prevents large griefing builds

## 🎯 **Child-Friendly Design Principles**

Based on research from projects like **GabbyGarden** and **Microsoft's Interactive NPCs**:

1. **Encouraging Language**: Always positive, never says "no"
2. **Simple Vocabulary**: Uses words kids understand
3. **Emoji Communication**: Makes responses fun and engaging
4. **Educational Value**: Teaches Minecraft concepts naturally
5. **Safety First**: Redirects inappropriate requests to fun alternatives
6. **Patience**: Handles repeated questions kindly

## 🚀 **Deployment**

### **Docker Deployment:**
```bash
# Build container
docker build -t minecraft-ai-bot .

# Run with environment file
docker run --env-file .env minecraft-ai-bot
```

### **Production Considerations:**
- Set `BOT_DEBUG=false` for cleaner logs
- Configure `ADMIN_USERS` with actual admin usernames
- Set appropriate `COMMAND_COOLDOWN` to prevent spam
- Enable `CHILD_SAFE_MODE=true` for kid-friendly operation

## 📈 **Recent Enhancements**

- ✅ **Complete knowledge-based AI system**
- ✅ **Child-friendly prompt engineering**  
- ✅ **Comprehensive Minecraft database**
- ✅ **Enhanced safety and content filtering**
- ✅ **Structured prompt translation**
- ✅ **Extended AI reasoning capabilities**

## 🤝 **Contributing**

To add new features:
1. **Knowledge Base**: Update `minecraft-knowledge.js` with new items/commands
2. **Prompts**: Enhance `prompt-translator.js` with better child-friendly prompts
3. **Safety**: Add new safety checks in `config.js`

## 📝 **License**

This project is designed for educational and family use. Please ensure compliance with Minecraft's Terms of Service and your server's rules.

---

**🎮 Built with ❤️ for young Minecraft players and their families!** 