/**
 * Bomb class for Bomberman game
 * Ports the bomb mechanics from the original C++ Bomb class
 */

class Bomb {
    constructor(x, y, currentTime, owner) {
        this.owner = owner; // Reference to the player who placed this bomb
        
        // Position (matching original grid snapping from Bomb.cpp lines 30-31)
        this.x = Math.floor((x + 8) / 32) * 32 + 7;
        this.y = Math.floor((y + 18) / 32) * 32 + 8;
        
        // Grid position for map interaction
        this.gridRow = Math.floor((this.y + 1) / 32);
        this.gridCol = Math.floor((this.x + 1) / 32);
        
        // Timing (matching original values from Bomb.cpp)
        this.birth = currentTime;
        this.lifespan = 3000; // 3 seconds in milliseconds
        this.lastMove = 0;
        
        // Animation (matching original 2-frame animation)
        this.currentFrame = 0; // 0 or 1
        this.animationSpeed = 500; // 500ms per frame
        
        // State
        this.exploded = false;
    }

    /**
     * Update bomb state (matching original Bomb::Update())
     * @param {number} currentTime - Current time in milliseconds
     * @param {number} deltaTime - Time since last update
     */
    update(currentTime, deltaTime) {
        this.lastMove += deltaTime;
        
        // Animate bomb sprite (matching original 500ms cycle)
        if (this.lastMove >= this.animationSpeed) {
            this.currentFrame = this.currentFrame === 0 ? 1 : 0;
            this.lastMove = 0;
        }
    }

    /**
     * Check if bomb should explode
     * @param {number} currentTime - Current time in milliseconds
     * @param {boolean} manualDetonate - Force detonation (for detonator bonus)
     * @param {boolean} chainReaction - Exploded due to another bomb's flames
     * @returns {boolean} True if bomb should explode
     */
    shouldExplode(currentTime, manualDetonate = false, chainReaction = false) {
        if (this.exploded) return false;
        
        // Check conditions (matching original BombCheck logic)
        const timeExpired = currentTime > (this.birth + this.lifespan);
        const hasDetonator = this.owner && this.owner.hasDetonate;

        // Strict C++ parity:
        // - Without detonator: bomb explodes on timer
        // - With detonator: timer no longer triggers explosion
        // - Chain reaction always triggers explosion
        return (!hasDetonator && timeExpired) || (hasDetonator && manualDetonate) || chainReaction;
    }

    /**
     * Explode the bomb and create flames
     * @param {GameMap} map - Game map reference
     * @param {number} currentTime - Current time in milliseconds
     * @returns {Flame} Flame object created by explosion
     */
    explode(map, currentTime) {
        if (this.exploded) return null;
        
        this.exploded = true;
        
        // Calculate flame spread (matching original Flamesize logic)
        const flameDistances = this.calculateFlameSpread(map);
        
        // Create flame object
        const flame = new Flame(
            this.x - 8,  // Offset matching original
            this.y - 8,
            flameDistances.up,
            flameDistances.down,
            flameDistances.left,
            flameDistances.right,
            currentTime
        );
        
        // Clear bomb from map
        map.setBomb(this.gridRow, this.gridCol, false);
        const currentTile = map.getTile(this.gridRow, this.gridCol);
        if (currentTile) {
            currentTile.crossable = true;
        }
        
        return flame;
    }

    /**
     * Calculate flame spread in all directions (matching original Flamesize logic)
     * @param {GameMap} map - Game map reference
     * @returns {Object} Flame distances {up, down, left, right}
     */
    calculateFlameSpread(map) {
        const power = this.owner ? this.owner.power : 1;
        const centerRow = Math.floor((this.y + 16) / 32);
        const centerCol = Math.floor((this.x + 16) / 32);
        
        const distances = {
            up: power,
            down: power,
            left: power,
            right: power
        };

        // Check upward spread
        for (let i = 1; i <= Math.min(power, centerRow); i++) {
            const tile = map.getTile(centerRow - i, centerCol);
            if (!tile) break;
            
            if (tile.getStopfire() === 2) { // Wall - complete stop
                distances.up = i - 1;
                break;
            }
            if (tile.getStopfire() === 1) { // Box - stop after destroying
                distances.up = i;
                this.destroyBox(map, centerRow - i, centerCol);
                break;
            }
        }

        // Check downward spread
        for (let i = 1; i <= Math.min(power, 12 - centerRow); i++) {
            const tile = map.getTile(centerRow + i, centerCol);
            if (!tile) break;
            
            if (tile.getStopfire() === 2) {
                distances.down = i - 1;
                break;
            }
            if (tile.getStopfire() === 1) {
                distances.down = i;
                this.destroyBox(map, centerRow + i, centerCol);
                break;
            }
        }

        // Check leftward spread
        for (let i = 1; i <= Math.min(power, centerCol); i++) {
            const tile = map.getTile(centerRow, centerCol - i);
            if (!tile) break;
            
            if (tile.getStopfire() === 2) {
                distances.left = i - 1;
                break;
            }
            if (tile.getStopfire() === 1) {
                distances.left = i;
                this.destroyBox(map, centerRow, centerCol - i);
                break;
            }
        }

        // Check rightward spread
        for (let i = 1; i <= Math.min(power, 16 - centerCol); i++) {
            const tile = map.getTile(centerRow, centerCol + i);
            if (!tile) break;
            
            if (tile.getStopfire() === 2) {
                distances.right = i - 1;
                break;
            }
            if (tile.getStopfire() === 1) {
                distances.right = i;
                this.destroyBox(map, centerRow, centerCol + i);
                break;
            }
        }

        return distances;
    }

    /**
     * Destroy a box and potentially reveal a bonus (matching original logic)
     * @param {GameMap} map - Game map reference
     * @param {number} row - Row of box to destroy
     * @param {number} col - Column of box to destroy
     */
    destroyBox(map, row, col) {
        const tile = map.getTile(row, col);
        if (!tile || tile.type !== 'box') return;
        
        const bonusType = tile.hasBonus();
        console.log(`Destroying box at (${row}, ${col}) with bonus type ${bonusType}`);
        
        if (bonusType === 0 || bonusType === 1 || bonusType === 2) {
            // Create bonus tile
            console.log(`Creating bonus tile type ${bonusType} at (${row}, ${col})`);
            map.setTile(row, col, new Bonus(row, col, bonusType));
        } else {
            // Create empty square
            map.setTile(row, col, new Square(row, col));
        }
    }

    /**
     * Get current animation frame data
     * @returns {Object} Frame data for rendering
     */
    getCurrentFrame() {
        return {
            frame: this.currentFrame,
            x: this.x,
            y: this.y
        };
    }

    /**
     * Get grid position
     * @returns {Object} Grid coordinates {row, col}
     */
    getGridPosition() {
        return {
            row: this.gridRow,
            col: this.gridCol
        };
    }

    /**
     * Get birth time (for explosion timing)
     * @returns {number} Birth time in milliseconds
     */
    getBirth() {
        return this.birth;
    }

    /**
     * Get lifespan (for explosion timing)
     * @returns {number} Lifespan in milliseconds
     */
    getLifespan() {
        return this.lifespan;
    }
}