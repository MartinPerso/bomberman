/**
 * Flame class for Bomberman game
 * Ports the flame/explosion system from the original C++ Flames class
 */

class Flame {
    constructor(x, y, distUp, distDown, distLeft, distRight, currentTime) {
        // Position (matching original offset from Flames.cpp)
        this.x = x;
        this.y = y;
        
        // Flame spread distances in each direction
        this.distUp = distUp;
        this.distDown = distDown;
        this.distLeft = distLeft;
        this.distRight = distRight;
        
        // Timing (matching original values)
        this.birth = currentTime;
        this.lifespan = 1000; // 1 second in milliseconds
        
        // Grid position for map interaction
        this.centerRow = Math.floor((this.y + 16) / 32);
        this.centerCol = Math.floor((this.x + 16) / 32);
        
        // State
        this.expired = false;
    }

    /**
     * Update flame state
     * @param {number} currentTime - Current time in milliseconds
     * @param {number} deltaTime - Time since last update
     */
    update(currentTime, deltaTime) {
        // Check if flame has expired
        if (currentTime > (this.birth + this.lifespan)) {
            this.expired = true;
        }
    }

    /**
     * Apply flame damage to map tiles (matching original explosion() logic)
     * @param {GameMap} map - Game map reference
     */
    applyDamage(map) {
        if (this.expired) return;
        
        // Set kill flag for center position
        map.setKills(this.centerRow, this.centerCol, true);
        
        // Apply damage upward
        for (let i = 0; i < this.distUp; i++) {
            const row = this.centerRow - (i + 1);
            if (row >= 0) {
                map.setKills(row, this.centerCol, true);
            }
        }
        
        // Apply damage downward
        for (let i = 0; i < this.distDown; i++) {
            const row = this.centerRow + (i + 1);
            if (row < map.height) {
                map.setKills(row, this.centerCol, true);
            }
        }
        
        // Apply damage leftward
        for (let i = 0; i < this.distLeft; i++) {
            const col = this.centerCol - (i + 1);
            if (col >= 0) {
                map.setKills(this.centerRow, col, true);
            }
        }
        
        // Apply damage rightward
        for (let i = 0; i < this.distRight; i++) {
            const col = this.centerCol + (i + 1);
            if (col < map.width) {
                map.setKills(this.centerRow, col, true);
            }
        }
    }

    /**
     * Get all flame segments for rendering (matching original explosion() rendering logic)
     * @returns {Array} Array of flame segments with position and type
     */
    getFlameSegments() {
        if (this.expired) return [];
        
        const segments = [];
        const tileSize = 32;
        
        // Center flame
        segments.push({
            type: 'center',
            x: this.centerCol * tileSize,
            y: this.centerRow * tileSize
        });
        
        // Upward flames
        for (let i = 1; i <= this.distUp; i++) {
            const row = this.centerRow - i;
            if (row >= 0) {
                segments.push({
                    type: i === this.distUp ? 'upEnd' : 'vertical',
                    x: this.centerCol * tileSize,
                    y: row * tileSize
                });
            }
        }
        
        // Downward flames
        for (let i = 1; i <= this.distDown; i++) {
            const row = this.centerRow + i;
            if (row < 13) { // Map height
                segments.push({
                    type: i === this.distDown ? 'downEnd' : 'vertical',
                    x: this.centerCol * tileSize,
                    y: row * tileSize
                });
            }
        }
        
        // Leftward flames
        for (let i = 1; i <= this.distLeft; i++) {
            const col = this.centerCol - i;
            if (col >= 0) {
                segments.push({
                    type: i === this.distLeft ? 'leftEnd' : 'horizontal',
                    x: col * tileSize,
                    y: this.centerRow * tileSize
                });
            }
        }
        
        // Rightward flames
        for (let i = 1; i <= this.distRight; i++) {
            const col = this.centerCol + i;
            if (col < 17) { // Map width
                segments.push({
                    type: i === this.distRight ? 'rightEnd' : 'horizontal',
                    x: col * tileSize,
                    y: this.centerRow * tileSize
                });
            }
        }
        
        return segments;
    }

    /**
     * Check if flame affects a specific grid position
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @returns {boolean} True if flame affects this position
     */
    affectsPosition(row, col) {
        if (this.expired) return false;
        
        // Check center
        if (row === this.centerRow && col === this.centerCol) {
            return true;
        }
        
        // Check vertical line (up/down)
        if (col === this.centerCol) {
            // Check upward
            if (row < this.centerRow && row >= this.centerRow - this.distUp) {
                return true;
            }
            // Check downward
            if (row > this.centerRow && row <= this.centerRow + this.distDown) {
                return true;
            }
        }
        
        // Check horizontal line (left/right)
        if (row === this.centerRow) {
            // Check leftward
            if (col < this.centerCol && col >= this.centerCol - this.distLeft) {
                return true;
            }
            // Check rightward
            if (col > this.centerCol && col <= this.centerCol + this.distRight) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if flame has expired
     * @returns {boolean} True if flame should be removed
     */
    isExpired() {
        return this.expired;
    }

    /**
     * Get birth time
     * @returns {number} Birth time in milliseconds
     */
    getBirth() {
        return this.birth;
    }

    /**
     * Get lifespan
     * @returns {number} Lifespan in milliseconds
     */
    getLifespan() {
        return this.lifespan;
    }

    /**
     * Get center grid position
     * @returns {Object} Center position {row, col}
     */
    getCenterPosition() {
        return {
            row: this.centerRow,
            col: this.centerCol
        };
    }
}