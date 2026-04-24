/**
 * Map generation and management for Bomberman game
 * Ports the exact map generation algorithm from main.cpp
 */

class GameMap {
    constructor(width, height) {
        this.width = width;   // 17 columns
        this.height = height; // 13 rows
        this.tiles = [];
        this.TILE_SIZE = 32;
        
        // Initialize empty map
        for (let row = 0; row < this.height; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.width; col++) {
                this.tiles[row][col] = null;
            }
        }
    }

    /**
     * Generate map using the exact algorithm from main.cpp lines 98-127
     */
    generate(debugMode = false) {
        // Generate bonus distribution (matching original algorithm or debug mode)
        const bonusVector = this.generateBonusDistribution(debugMode);
        let bonusIndex = 0;

        // First pass: Create outer walls (matching original loop structure)
        for (let col = 0; col < this.width; col++) {
            for (let row = 0; row < this.height; row++) {
                this.tiles[row][col] = new Wall(row, col);
            }
        }

        // Second pass: Create inner area with boxes and safe zones
        // (matching original nested loop from main.cpp lines 109-127)
        for (let col = 1; col < this.width - 1; col++) {
            for (let row = 1; row < this.height - 1; row++) {
                // Check if position should have a box (matching original condition)
                if (row % 2 === 1 || col % 2 === 1) {
                    // Check for safe zones (matching original conditions)
                    if ((row <= 2 && col <= 2) || (row >= 10 && col >= 14)) {
                        // Safe zone - create empty square
                        this.tiles[row][col] = new Square(row, col);
                    } else {
                        // Create destructible box with bonus
                        const box = new Box(row, col);
                        if (bonusIndex < bonusVector.length) {
                            box.setBonus(bonusVector[bonusIndex]);
                            bonusIndex++;
                        }
                        this.tiles[row][col] = box;
                    }
                }
            }
        }
    }

    /**
     * Generate bonus distribution matching original algorithm from main.cpp lines 73-96
     * @param {boolean} debugMode - If true, make bonuses much more common
     * @returns {Array<number>} Array of bonus types
     */
    generateBonusDistribution(debugMode = false) {
        let nombrePowerBonus, nombreExtraBombBonus, nombreDetonate, totalBoxes;
        
        if (debugMode) {
            // Debug mode: much more bonuses
            nombrePowerBonus = 40;      // Power bonuses
            nombreExtraBombBonus = 40;  // Extra bomb bonuses  
            nombreDetonate = 20;        // Detonator bonuses
            totalBoxes = 124;           // Total boxes that can have bonuses
        } else {
            // Original distribution
            nombrePowerBonus = 15;      // Power bonuses
            nombreExtraBombBonus = 15;  // Extra bomb bonuses  
            nombreDetonate = 2;         // Detonator bonuses
            totalBoxes = 124;           // Total boxes that can have bonuses
        }
        
        const bonusVector = [];
        
        // Add power bonuses (type 0)
        for (let i = 0; i < nombrePowerBonus; i++) {
            bonusVector.push(0);
        }
        
        // Add extra bomb bonuses (type 1)
        for (let i = 0; i < nombreExtraBombBonus; i++) {
            bonusVector.push(1);
        }
        
        // Add detonator bonuses (type 2)
        for (let i = 0; i < nombreDetonate; i++) {
            bonusVector.push(2);
        }
        
        // Fill remaining slots with no bonus (type 99)
        const remainingSlots = totalBoxes - nombrePowerBonus - nombreExtraBombBonus - nombreDetonate;
        for (let i = 0; i < remainingSlots; i++) {
            bonusVector.push(99);
        }
        
        // Shuffle the bonus vector (matching original std::random_shuffle)
        this.shuffleArray(bonusVector);
        
        return bonusVector;
    }

    /**
     * Shuffle array in place (Fisher-Yates shuffle)
     * @param {Array} array - Array to shuffle
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Get tile at specific grid position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Tile|null} Tile at position or null if out of bounds
     */
    getTile(row, col) {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
            return null;
        }
        return this.tiles[row][col];
    }

    /**
     * Set tile at specific grid position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {Tile} tile - Tile to set
     */
    setTile(row, col, tile) {
        if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
            this.tiles[row][col] = tile;
        }
    }

    /**
     * Get tile at pixel position
     * @param {number} x - X pixel coordinate
     * @param {number} y - Y pixel coordinate
     * @returns {Tile|null} Tile at position or null if out of bounds
     */
    getTileAtPixel(x, y) {
        const col = Math.floor(x / this.TILE_SIZE);
        const row = Math.floor(y / this.TILE_SIZE);
        return this.getTile(row, col);
    }

    /**
     * Convert pixel coordinates to grid coordinates
     * @param {number} x - X pixel coordinate
     * @param {number} y - Y pixel coordinate
     * @returns {Object} Grid coordinates {row, col}
     */
    pixelToGrid(x, y) {
        return {
            row: Math.floor(y / this.TILE_SIZE),
            col: Math.floor(x / this.TILE_SIZE)
        };
    }

    /**
     * Convert grid coordinates to pixel coordinates
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {Object} Pixel coordinates {x, y}
     */
    gridToPixel(row, col) {
        return {
            x: col * this.TILE_SIZE,
            y: row * this.TILE_SIZE
        };
    }

    /**
     * Check if a position is crossable (for collision detection)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if position can be crossed
     */
    isCrossable(row, col) {
        const tile = this.getTile(row, col);
        return tile ? tile.crossable : false;
    }

    /**
     * Check if a position has a bomb
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if position has a bomb
     */
    hasBomb(row, col) {
        const tile = this.getTile(row, col);
        return tile ? tile.hasBomb : false;
    }

    /**
     * Set bomb flag for a tile
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {boolean} hasBomb - Whether tile has a bomb
     */
    setBomb(row, col, hasBomb) {
        const tile = this.getTile(row, col);
        if (tile) {
            tile.hasBomb = hasBomb;
        }
    }

    /**
     * Set kill flag for a tile (for flame damage)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {boolean} kills - Whether tile causes damage
     */
    setKills(row, col, kills) {
        const tile = this.getTile(row, col);
        if (tile) {
            tile.kills = kills;
        }
    }

    /**
     * Check if a tile causes damage
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if tile causes damage
     */
    getKills(row, col) {
        const tile = this.getTile(row, col);
        return tile ? tile.kills : false;
    }

    /**
     * Reset all kill flags (called each frame like original)
     */
    resetKillFlags() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.getTile(row, col);
                if (tile) {
                    tile.kills = false;
                }
            }
        }
    }
}