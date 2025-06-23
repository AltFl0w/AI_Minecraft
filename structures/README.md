# Structure Files

This directory contains `.mcstructure` files that the AI Admin Bot can load and place in the world.

## Adding Structure Files

1. Create your structure in Minecraft using structure blocks
2. Save the structure with a descriptive name (e.g., `bear_habitat.mcstructure`)
3. Copy the `.mcstructure` file to this directory
4. The bot will automatically detect it on restart

## Naming Conventions

Use descriptive names that players might naturally say:
- `bear_habitat.mcstructure` - matches "build a bear habitat"
- `lion_den.mcstructure` - matches "create a lion den"
- `aviary.mcstructure` - matches "build an aviary"
- `control_room.mcstructure` - matches "build a control room"

## Structure Aliases

The bot also recognizes aliases defined in `config.js`. For example:
- "bear" matches: bear_habitat, bear_pen, bear_enclosure
- "bird" matches: aviary, bird_habitat, bird_cage

## Usage Examples

Players can request structures using natural language:
- "@admin build a bear habitat"
- "@admin create a snowy bear pen"
- "@admin I need an aviary for the birds"
- "@admin construct a lion enclosure"

The bot will:
1. Look for exact filename matches first
2. Check aliases for partial matches
3. Use AI to interpret and build custom structures if no match found 