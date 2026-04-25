# HTML Bomberman

A faithful HTML5 port of the classic C++ SDL Bomberman game.

## How to Play

1. **Start the Game**: Open `index.html` in a web browser or run a local server
2. **Controls**:
   - **Player 1**: WASD to move, Left Shift to place bombs, Left Ctrl to detonate (if you have detonator)
   - **Player 2**: Arrow keys to move, O to place bombs, P to detonate (if you have detonator)

## Objective

- Destroy your opponent by trapping them with bomb explosions
- Collect power-ups by destroying boxes:
  - **Red**: Increase bomb power (explosion range)
  - **Blue**: Get extra bombs (can place more bombs simultaneously)
  - **Gold**: Get detonator (manually trigger bombs with your detonate key)

## Features

- Faithful recreation of original C++ game mechanics
- Same map generation algorithm with random bonus distribution
- Identical player movement, collision detection, and bomb timing
- Original sprite assets converted to web-compatible format
- Quality-of-life improvements: clear UI

## Technical Details

- Pure JavaScript (ES6+) with Canvas 2D API
- No external dependencies
- Pixel-perfect sprite rendering with transparency
- 60fps game loop with precise timing
- Responsive design for different screen sizes

## Running Locally

```bash
# Navigate to the game directory
cd bomberman-html

# Start a local web server (Python 3)
python3 -m http.server 8000

# Or with Python 2
python -m SimpleHTTPServer 8000

# Or with Node.js
npx http-server

# Then open http://localhost:8000 in your browser
```

## File Structure

```
bomberman-html/
├── index.html          # Main game page
├── css/game.css        # Game styling
├── js/
│   ├── game.js         # Main game loop
│   ├── player.js       # Player mechanics
│   ├── bomb.js         # Bomb system
│   ├── flame.js        # Explosion system
│   ├── tiles.js        # Map tiles
│   ├── map.js          # Map generation
│   ├── input.js        # Keyboard handling
│   ├── renderer.js     # Canvas rendering
│   └── assets.js       # Asset loading
└── assets/             # Game sprites (PNG format)
```

## Original C++ Port Notes

This HTML version maintains the exact same:
- Map dimensions (13×17 grid)
- Player movement speed (100 pixels/second)
- Bomb timer (3 seconds)
- Flame duration (1 second)
- Collision detection logic
- Bonus distribution (15 power, 15 extra bombs, 2 detonators)
- Animation timing and sprite frames

Enjoy the game!
