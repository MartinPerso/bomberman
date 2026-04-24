/**
 * Tile classes for Bomberman game
 * Ports the tile system from the original C++ Square, Wall, Box, and Bonus classes
 */

/**
 * Base tile class (equivalent to Square.cpp)
 */
class Tile {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.x = col * 32;
        this.y = row * 32;
        this.width = 32;
        this.height = 32;
        
        // Properties matching original Square class
        this.crossable = true;
        this.stopfire = 0;  // 0 = doesn't stop flames, 1 = stops flames (destructible), 2 = stops flames (indestructible)
        this.hasBomb = false;
        this.kills = false;
        this.type = 'tile';
    }

    /**
     * Get the type for bonus checking (matching original GetType())
     * @returns {number} Type identifier
     */
    getType() {
        return 99; // Default no bonus
    }

    /**
     * Check if tile has a bonus (matching original HasBonus())
     * @returns {number} Bonus type or 99 for no bonus
     */
    hasBonus() {
        return 99; // Default no bonus
    }

    /**
     * Set bonus type (matching original SetBonus())
     * @param {number} bonusType - Bonus type to set
     */
    setBonus(bonusType) {
        // Base implementation does nothing
    }

    /**
     * Get stopfire value (matching original GetStopfire())
     * @returns {number} Stopfire value
     */
    getStopfire() {
        return this.stopfire;
    }
}

/**
 * Empty square tile (equivalent to Square class)
 */
class Square extends Tile {
    constructor(row, col) {
        super(row, col);
        this.crossable = true;
        this.stopfire = 0; // Doesn't stop flames
        this.type = 'square';
    }
}

/**
 * Wall tile (equivalent to Wall class)
 */
class Wall extends Tile {
    constructor(row, col) {
        super(row, col);
        this.crossable = false;
        this.stopfire = 2; // Completely blocks flames
        this.type = 'wall';
    }
}

/**
 * Destructible box tile (equivalent to Box class)
 */
class Box extends Tile {
    constructor(row, col) {
        super(row, col);
        this.crossable = false;
        this.stopfire = 1; // Blocks flames but can be destroyed
        this.type = 'box';
        
        // Bonus properties (matching original Box class)
        this.hasPowerBonus = false;
        this.hasExtraBombBonus = false;
        this.hasDetonate = false;
    }

    /**
     * Check if box has a bonus (matching original HasBonus())
     * @returns {number} Bonus type
     */
    hasBonus() {
        if (this.hasPowerBonus) return 0;
        if (this.hasExtraBombBonus) return 1;
        if (this.hasDetonate) return 2;
        return 99; // No bonus
    }

    /**
     * Set bonus type (matching original SetBonus())
     * @param {number} bonusType - Bonus type (0=power, 1=extra bomb, 2=detonator, 99=none)
     */
    setBonus(bonusType) {
        this.hasPowerBonus = (bonusType === 0);
        this.hasExtraBombBonus = (bonusType === 1);
        this.hasDetonate = (bonusType === 2);
    }
}

/**
 * Bonus tile (equivalent to Bonus class)
 * Created when a box is destroyed and reveals a bonus
 */
class Bonus extends Tile {
    constructor(row, col, bonusType) {
        super(row, col);
        this.crossable = true;
        this.stopfire = 4; // Special value indicating this is a bonus tile
        this.bonusType = bonusType; // 0=power, 1=extra bomb, 2=detonator
        this.type = 'bonus';
    }

    /**
     * Get bonus type (matching original GetType())
     * @returns {number} Bonus type
     */
    getType() {
        return this.bonusType;
    }

    /**
     * Check if this is a bonus tile
     * @returns {number} Always returns the bonus type
     */
    hasBonus() {
        return this.bonusType;
    }
}