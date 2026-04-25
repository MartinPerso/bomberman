/**
 * Player class for Bomberman game
 * Ports the player mechanics from the original C++ Player class
 */

class Player {
    constructor(type, startX, startY) {
        this.type = type; // 1 or 2
        
        // Position (matching original starting positions)
        this.x = startX;
        this.y = startY;
        
        // Movement properties (matching original values from Player.cpp)
        this.speed = 100; // pixels per second
        this.lastTime = 0;
        this.lastMove = 0;
        
        // Animation properties (matching original fps value)
        this.animationSpeed = 100; // 100ms per frame
        this.currentDirection = 'down';
        this.currentFrame = 1; // 1, 2, 3, 4 for animation cycle
        this.isMoving = false;
        
        // Game properties (matching original initial values)
        this.power = 1;        // Bomb explosion power
        this.bombDisp = 1;     // Number of bombs available
        this.alive = true;
        this.hasDetonate = false; // Detonator bonus
        
        // Game objects
        this.bombs = [];
        this.flames = [];
        
        // Collision box (matching original collision detection)
        this.collisionWidth = 18;
        this.collisionHeight = 15;
        this.collisionOffsetY = 10;

        // Player 3 uses a 32px-wide third-party sprite, centered on the same hitbox.
        this.renderOffsetX = this.type === 3 ? -6 : 0;
        this.renderOffsetY = 0;
    }

    /**
     * Update player state (matching original Player::Update() structure)
     * @param {number} deltaTime - Time since last update in milliseconds
     * @param {GameMap} map - Game map reference
     * @param {Object} keyStates - Current keyboard states
     */
    update(deltaTime, map, keyStates) {
        if (!this.alive) return;
        this.updateBombAndFlamePhase(deltaTime, map, keyStates);
        this.updatePlayerPhase(deltaTime, map, keyStates);
    }

    /**
     * First frame phase for strict C++ parity:
     * process bombs and flames for all players before movement.
     */
    updateBombAndFlamePhase(deltaTime, map, keyStates) {
        if (!this.alive) return;
        const input = this.getPlayerInput(keyStates);
        this.updateBombs(deltaTime, map, input.detonate);
        this.updateFlames(deltaTime, map);
    }

    /**
     * Second frame phase for strict C++ parity:
     * movement, bomb placement, bonus pickup, and death check.
     */
    updatePlayerPhase(deltaTime, map, keyStates) {
        if (!this.alive) return;

        this.lastTime += deltaTime;
        this.lastMove += deltaTime;

        const input = this.getPlayerInput(keyStates);

        // Handle movement (matching original priority: up > left > down > right)
        if (input.up) {
            this.goUp(deltaTime, map);
        } else if (input.left) {
            this.goLeft(deltaTime, map);
        } else if (input.down) {
            this.goDown(deltaTime, map);
        } else if (input.right) {
            this.goRight(deltaTime, map);
        } else {
            this.stand();
        }

        // Handle bomb placement
        if (input.bomb) {
            this.plantBomb(map);
        }

        // Check for bonus collection
        this.checkBonusCollection(map);

        // Check if player is hit by flames
        this.checkFlameCollision(map);
    }

    /**
     * Get input state for this player
     * @param {Object} keyStates - Current keyboard states
     * @returns {Object} Input state
     */
    getPlayerInput(keyStates) {
        return ControlConfig.getPlayerInput(this.type, keyStates);
    }

    /**
     * Move player up (matching original GoUp() logic)
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {GameMap} map - Game map reference
     */
    goUp(deltaTime, map) {
        const collision = this.mapCollision(map);
        
        if (!collision.up) {
            this.y -= (this.speed * deltaTime) / 1000;
        }
        
        // Adjust position if colliding
        while (this.mapCollision(map).up) {
            this.y += 1;
        }
        
        this.updateAnimation('up');
    }

    /**
     * Move player down (matching original GoDown() logic)
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {GameMap} map - Game map reference
     */
    goDown(deltaTime, map) {
        const collision = this.mapCollision(map);
        
        if (!collision.down) {
            this.y += (this.speed * deltaTime) / 1000;
        }
        
        // Adjust position if colliding
        while (this.mapCollision(map).down) {
            this.y -= 1;
        }
        
        this.updateAnimation('down');
    }

    /**
     * Move player left (matching original GoLeft() logic)
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {GameMap} map - Game map reference
     */
    goLeft(deltaTime, map) {
        const collision = this.mapCollision(map);
        
        if (this.x > 32 && !collision.left) {
            this.x -= (this.speed * deltaTime) / 1000;
        }
        
        // Adjust position if colliding
        while (this.mapCollision(map).left) {
            this.x += 1;
        }
        
        this.updateAnimation('left');
    }

    /**
     * Move player right (matching original GoRight() logic)
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {GameMap} map - Game map reference
     */
    goRight(deltaTime, map) {
        const collision = this.mapCollision(map);
        
        if (!collision.right) {
            this.x += (this.speed * deltaTime) / 1000;
        }
        
        // Adjust position if colliding
        while (this.mapCollision(map).right) {
            this.x -= 1;
        }
        
        this.updateAnimation('right');
    }

    /**
     * Set player to standing animation (matching original Stand() logic)
     */
    stand() {
        this.isMoving = false;
        this.currentFrame = 1; // Reset to first frame
        this.lastMove = 0;
    }

    /**
     * Update animation state
     * @param {string} direction - Movement direction
     */
    updateAnimation(direction) {
        this.isMoving = true;
        this.currentDirection = direction;
        
        // Cycle through animation frames (matching original timing)
        if (this.lastMove >= this.animationSpeed) {
            this.currentFrame++;
            if (this.currentFrame > 4) {
                this.currentFrame = 1;
            }
            this.lastMove = 0;
        }
    }

    /**
     * Check collision with map tiles (matching original mapCollision() logic)
     * @param {GameMap} map - Game map reference
     * @returns {Object} Collision state {up, down, left, right}
     */
    mapCollision(map) {
        const collision = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Player collision box (matching original collision box)
        const playerBox = {
            x: this.x,
            y: this.y + this.collisionOffsetY,
            width: this.collisionWidth,
            height: this.collisionHeight
        };
        
        // Check all map tiles
        for (let row = 0; row < map.height; row++) {
            for (let col = 0; col < map.width; col++) {
                const tile = map.getTile(row, col);
                if (!tile || tile.crossable) continue;
                
                const tileBox = {
                    x: col * 32,
                    y: row * 32,
                    width: 32,
                    height: 32
                };
                
                // Check specific collision directions (matching original logic)
                if (this.boxCollision(playerBox, tileBox)) {
                    // Determine collision direction based on overlap
                    if (tileBox.y + tileBox.height >= playerBox.y && 
                        tileBox.x + tileBox.width >= playerBox.x && 
                        tileBox.x <= playerBox.x + playerBox.width && 
                        tileBox.y + tileBox.height <= playerBox.y + playerBox.height) {
                        collision.up = true;
                    }
                    if (tileBox.y <= playerBox.y + playerBox.height && 
                        tileBox.x + tileBox.width >= playerBox.x && 
                        tileBox.x <= playerBox.x + playerBox.width && 
                        tileBox.y >= playerBox.y) {
                        collision.down = true;
                    }
                    if (tileBox.y + tileBox.height >= playerBox.y && 
                        tileBox.y <= playerBox.y + playerBox.height && 
                        tileBox.x + tileBox.width >= playerBox.x && 
                        tileBox.x + tileBox.width <= playerBox.x + playerBox.width) {
                        collision.left = true;
                    }
                    if (tileBox.y + tileBox.height >= playerBox.y && 
                        tileBox.y <= playerBox.y + playerBox.height && 
                        tileBox.x <= playerBox.x + playerBox.width && 
                        tileBox.x >= playerBox.x) {
                        collision.right = true;
                    }
                }
            }
        }
        
        return collision;
    }

    /**
     * Check collision between two boxes
     * @param {Object} boxA - First box {x, y, width, height}
     * @param {Object} boxB - Second box {x, y, width, height}
     * @returns {boolean} True if boxes collide
     */
    boxCollision(boxA, boxB) {
        return !(boxB.y + boxB.height <= boxA.y || 
                 boxB.y >= boxA.y + boxA.height || 
                 boxB.x + boxB.width <= boxA.x || 
                 boxB.x >= boxA.x + boxA.width);
    }

    /**
     * Plant a bomb (matching original BombPlanting() logic)
     * @param {GameMap} map - Game map reference
     */
    plantBomb(map) {
        if (this.bombs.length >= this.bombDisp) return;
        
        const gridPos = this.getGridPosition();
        
        // Check if position already has a bomb
        if (map.hasBomb(gridPos.row, gridPos.col)) return;
        
        // Create and place bomb
        const bomb = new Bomb(this.x, this.y, performance.now(), this);
        this.bombs.push(bomb);
        
        // Mark map position as having a bomb
        map.setBomb(gridPos.row, gridPos.col, true);
    }

    /**
     * Update bombs and handle explosions
     * @param {number} deltaTime - Time delta
     * @param {GameMap} map - Game map reference
     * @param {boolean} manualDetonate - Manual detonation trigger
     */
    updateBombs(deltaTime, map, manualDetonate, activeFlames = []) {
        const currentTime = performance.now();
        let explodedAny = false;
        // Single-update cascade: keep evaluating until no new bomb explodes.
        let explodedThisPass;
        do {
            explodedThisPass = false;

            for (let i = this.bombs.length - 1; i >= 0; i--) {
                const bomb = this.bombs[i];
                bomb.update(currentTime, deltaTime);

                // Chain reaction can come from map kill flags and/or active flame geometry.
                // The explicit flame check guarantees immediate detonation parity when bombs
                // are adjacent and a flame has already reached their tile this update.
                const chainReaction =
                    map.getKills(bomb.gridRow, bomb.gridCol) ||
                    this.flames.some((flame) => !flame.isExpired() && flame.affectsPosition(bomb.gridRow, bomb.gridCol)) ||
                    activeFlames.some((flame) => flame.affectsPosition(bomb.gridRow, bomb.gridCol));
                if (bomb.shouldExplode(currentTime, manualDetonate, chainReaction)) {
                    const flame = bomb.explode(map, currentTime);
                    if (flame) {
                        this.flames.push(flame);
                        // Make this explosion immediately visible to other bombs this tick.
                        flame.applyDamage(map);
                    }
                    this.bombs.splice(i, 1);
                    explodedThisPass = true;
                    explodedAny = true;
                } else {
                    // Check if player has moved away from bomb
                    const bombGridPos = bomb.getGridPosition();
                    const playerBox = {
                        x: this.x,
                        y: this.y + this.collisionOffsetY,
                        width: this.collisionWidth,
                        height: this.collisionHeight
                    };
                    const bombBox = {
                        x: bombGridPos.col * 32,
                        y: bombGridPos.row * 32,
                        width: 32,
                        height: 32
                    };

                    if (!this.boxCollision(playerBox, bombBox)) {
                        // Player moved away, make bomb solid
                        const tile = map.getTile(bombGridPos.row, bombGridPos.col);
                        if (tile) {
                            tile.crossable = false;
                        }
                    }
                }
            }
        } while (explodedThisPass);

        return explodedAny;
    }

    /**
     * Update flames
     * @param {number} deltaTime - Time delta
     * @param {GameMap} map - Game map reference
     */
    updateFlames(deltaTime, map) {
        const currentTime = performance.now();
        
        for (let i = this.flames.length - 1; i >= 0; i--) {
            const flame = this.flames[i];
            flame.update(currentTime, deltaTime);
            
            if (flame.isExpired()) {
                this.flames.splice(i, 1);
            } else {
                flame.applyDamage(map);
            }
        }
    }

    /**
     * Check for bonus collection (matching original BonusCheck() logic)
     * @param {GameMap} map - Game map reference
     */
    checkBonusCollection(map) {
        const gridPos = this.getGridPosition();
        const tile = map.getTile(gridPos.row, gridPos.col);
        
        if (tile && tile.getStopfire() === 4) { // Bonus tile
            const bonusType = tile.getType();
            
            console.log(`Player ${this.type} collected bonus type ${bonusType}`);
            
            switch (bonusType) {
                case 0: // Power bonus
                    this.power++;
                    console.log(`Player ${this.type} power increased to ${this.power}`);
                    break;
                case 1: // Extra bomb bonus
                    this.bombDisp++;
                    console.log(`Player ${this.type} bomb capacity increased to ${this.bombDisp}`);
                    break;
                case 2: // Detonator bonus
                    this.hasDetonate = true;
                    console.log(`Player ${this.type} got detonator ability`);
                    break;
            }
            
            // Replace bonus with empty square
            map.setTile(gridPos.row, gridPos.col, new Square(gridPos.row, gridPos.col));
        }
    }

    /**
     * Check if player is hit by flames
     * @param {GameMap} map - Game map reference
     */
    checkFlameCollision(map) {
        const gridPos = this.getGridPosition();
        
        if (map.getKills(gridPos.row, gridPos.col)) {
            this.alive = false;
        }
    }

    /**
     * Get player's current grid position
     * @returns {Object} Grid position {row, col}
     */
    getGridPosition() {
        return {
            row: Math.floor((this.y + 18) / 32),
            col: Math.floor((this.x + 8) / 32)
        };
    }

    /**
     * Get current sprite information for rendering
     * @returns {Object} Sprite data {direction, frame, x, y}
     */
    getCurrentSprite() {
        return {
            direction: this.currentDirection,
            frame: this.currentFrame,
            x: this.x + this.renderOffsetX,
            y: this.y + this.renderOffsetY,
            type: this.type
        };
    }
}
