/**
 * Renderer class for Bomberman game
 * Handles all Canvas 2D rendering with sprite support
 */

class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.TILE_SIZE = 32;
    }

    /**
     * Render the background
     */
    renderBackground() {
        const backgroundImage = assetLoader.getAsset('background');
        if (backgroundImage) {
            this.ctx.drawImage(backgroundImage, 0, 0);
        } else {
            // Fallback solid color
            this.ctx.fillStyle = '#2a5a2a';
            this.ctx.fillRect(0, 0, 544, 416);
        }
    }

    /**
     * Render the game map
     * @param {GameMap} map - Game map to render
     */
    renderMap(map) {
        for (let row = 0; row < map.height; row++) {
            for (let col = 0; col < map.width; col++) {
                const tile = map.getTile(row, col);
                if (tile) {
                    this.renderTile(tile);
                }
            }
        }
    }

    /**
     * Render a single tile
     * @param {Tile} tile - Tile to render
     */
    renderTile(tile) {
        let assetName, spriteName;
        
        switch (tile.type) {
            case 'square':
                assetName = 'square';
                spriteName = 'square';
                break;
            case 'wall':
                assetName = 'wall';
                spriteName = 'wall';
                break;
            case 'box':
                assetName = 'box';
                spriteName = 'box';
                break;
            case 'bonus':
                assetName = 'bonus';
                switch (tile.bonusType) {
                    case 0: spriteName = 'power'; break;
                    case 1: spriteName = 'extraBomb'; break;
                    case 2: spriteName = 'detonator'; break;
                    default: spriteName = 'power'; break;
                }
                break;
            default:
                return; // Don't render unknown tiles
        }
        
        const image = assetLoader.getAsset(assetName);
        let spriteData;
        
        if (tile.type === 'bonus') {
            spriteData = assetLoader.getSpriteData('bonus', spriteName);
        } else {
            spriteData = assetLoader.getSpriteData('tiles', spriteName);
        }
        
        if (image && spriteData) {
            this.ctx.drawImage(
                image,
                spriteData.x, spriteData.y, spriteData.w, spriteData.h,
                tile.x, tile.y, this.TILE_SIZE, this.TILE_SIZE
            );
        } else {
            // Fallback rendering
            this.renderTileFallback(tile);
        }
    }

    /**
     * Fallback tile rendering when sprites aren't available
     * @param {Tile} tile - Tile to render
     */
    renderTileFallback(tile) {
        let color;
        switch (tile.type) {
            case 'square':
                color = '#4a7c59';
                break;
            case 'wall':
                color = '#8b4513';
                break;
            case 'box':
                color = '#daa520';
                break;
            case 'bonus':
                switch (tile.bonusType) {
                    case 0: color = '#ff4500'; break; // Power - red
                    case 1: color = '#00bfff'; break; // Extra bomb - blue
                    case 2: color = '#ffd700'; break; // Detonator - gold
                    default: color = '#ff4500'; break;
                }
                break;
            default:
                color = '#666666';
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(tile.x, tile.y, this.TILE_SIZE, this.TILE_SIZE);
        
        // Add border for visibility
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tile.x, tile.y, this.TILE_SIZE, this.TILE_SIZE);
    }

    /**
     * Render a player
     * @param {Player} player - Player to render
     */
    renderPlayer(player) {
        const sprite = player.getCurrentSprite();
        const assetName = `player${sprite.type}`;
        const image = assetLoader.getAsset(assetName);
        
        if (!image) {
            this.renderPlayerFallback(player);
            return;
        }
        
        // Get sprite data based on direction and frame
        const spriteName = this.getPlayerSpriteName(sprite.direction, sprite.frame);
        const spriteData = assetLoader.getSpriteData(assetName, spriteName);
        
        if (spriteData) {
            this.ctx.drawImage(
                image,
                spriteData.x, spriteData.y, spriteData.w, spriteData.h,
                sprite.x, sprite.y, spriteData.w, spriteData.h
            );
        } else {
            this.renderPlayerFallback(player);
        }
    }

    /**
     * Get sprite name for player animation
     * @param {string} direction - Movement direction
     * @param {number} frame - Animation frame (1-4)
     * @returns {string} Sprite name
     */
    getPlayerSpriteName(direction, frame) {
        return `${direction}${frame}`;
    }

    /**
     * Fallback player rendering
     * @param {Player} player - Player to render
     */
    renderPlayerFallback(player) {
        const sprite = player.getCurrentSprite();
        const color = sprite.type === 1 ? '#4a90e2' : '#e24a4a';
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(sprite.x, sprite.y, 18, 33);
        
        // Add simple directional indicator
        this.ctx.fillStyle = '#ffffff';
        let indicatorX = sprite.x + 9;
        let indicatorY = sprite.y + 16;
        
        switch (sprite.direction) {
            case 'up':
                indicatorY = sprite.y + 5;
                break;
            case 'down':
                indicatorY = sprite.y + 25;
                break;
            case 'left':
                indicatorX = sprite.x + 2;
                break;
            case 'right':
                indicatorX = sprite.x + 14;
                break;
        }
        
        this.ctx.fillRect(indicatorX - 2, indicatorY - 2, 4, 4);
    }

    /**
     * Render bombs
     * @param {Array<Bomb>} bombs - Array of bombs to render
     */
    renderBombs(bombs) {
        const bombImage = assetLoader.getAsset('bomb');
        
        for (const bomb of bombs) {
            const frameData = bomb.getCurrentFrame();
            
            if (bombImage) {
                const spriteName = frameData.frame === 0 ? 'frame1' : 'frame2';
                const spriteData = assetLoader.getSpriteData('bomb', spriteName);
                
                if (spriteData) {
                    this.ctx.drawImage(
                        bombImage,
                        spriteData.x, spriteData.y, spriteData.w, spriteData.h,
                        frameData.x, frameData.y, spriteData.w, spriteData.h
                    );
                }
            } else {
                // Fallback bomb rendering
                const size = frameData.frame === 0 ? 16 : 18;
                this.ctx.fillStyle = frameData.frame === 0 ? '#333333' : '#555555';
                this.ctx.fillRect(frameData.x, frameData.y, size, size);
                
                // Add fuse indicator
                this.ctx.fillStyle = '#ff4500';
                this.ctx.fillRect(frameData.x + size/2 - 1, frameData.y - 3, 2, 3);
            }
        }
    }

    /**
     * Render flames
     * @param {Array<Flame>} flames - Array of flames to render
     */
    renderFlames(flames) {
        const flameImage = assetLoader.getAsset('flames');
        
        for (const flame of flames) {
            const segments = flame.getFlameSegments();
            
            for (const segment of segments) {
                if (flameImage) {
                    const spriteData = assetLoader.getSpriteData('flames', segment.type);
                    
                    if (spriteData) {
                        this.ctx.drawImage(
                            flameImage,
                            spriteData.x, spriteData.y, spriteData.w, spriteData.h,
                            segment.x, segment.y, this.TILE_SIZE, this.TILE_SIZE
                        );
                    }
                } else {
                    // Fallback flame rendering
                    this.ctx.fillStyle = this.getFlameColor(segment.type);
                    this.ctx.fillRect(segment.x, segment.y, this.TILE_SIZE, this.TILE_SIZE);
                }
            }
        }
    }

    /**
     * Get flame color for fallback rendering
     * @param {string} type - Flame segment type
     * @returns {string} Color string
     */
    getFlameColor(type) {
        switch (type) {
            case 'center':
                return '#ff6b35';
            case 'upEnd':
            case 'downEnd':
            case 'leftEnd':
            case 'rightEnd':
                return '#ff8c42';
            case 'horizontal':
            case 'vertical':
                return '#ffa500';
            default:
                return '#ff4500';
        }
    }

    /**
     * Render debug information (collision boxes, grid, etc.)
     * @param {Array<Player>} players - Players to show debug info for
     * @param {GameMap} map - Game map
     */
    renderDebug(players, map) {
        // Grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= map.width; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.TILE_SIZE, 0);
            this.ctx.lineTo(i * this.TILE_SIZE, map.height * this.TILE_SIZE);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= map.height; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.TILE_SIZE);
            this.ctx.lineTo(map.width * this.TILE_SIZE, i * this.TILE_SIZE);
            this.ctx.stroke();
        }
        
        // Show hidden bonuses in boxes
        for (let row = 0; row < map.height; row++) {
            for (let col = 0; col < map.width; col++) {
                const tile = map.getTile(row, col);
                if (tile && tile.type === 'box') {
                    const bonusType = tile.hasBonus();
                    if (bonusType !== 99) {
                        // Draw bonus indicator
                        let color;
                        switch (bonusType) {
                            case 0: color = '#ff4500'; break; // Power - red
                            case 1: color = '#00bfff'; break; // Extra bomb - blue
                            case 2: color = '#ffd700'; break; // Detonator - gold
                        }
                        
                        this.ctx.fillStyle = color;
                        this.ctx.fillRect(
                            col * this.TILE_SIZE + 4, 
                            row * this.TILE_SIZE + 4, 
                            this.TILE_SIZE - 8, 
                            this.TILE_SIZE - 8
                        );
                        
                        // Add text indicator
                        this.ctx.fillStyle = '#000000';
                        this.ctx.font = '12px monospace';
                        this.ctx.textAlign = 'center';
                        const text = bonusType === 0 ? 'P' : bonusType === 1 ? 'B' : 'D';
                        this.ctx.fillText(
                            text, 
                            col * this.TILE_SIZE + this.TILE_SIZE / 2, 
                            row * this.TILE_SIZE + this.TILE_SIZE / 2 + 4
                        );
                    }
                }
            }
        }
        
        // Player collision boxes
        for (const player of players) {
            if (!player.alive) continue;
            
            this.ctx.strokeStyle = player.type === 1 ? '#4a90e2' : '#e24a4a';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                player.x, 
                player.y + player.collisionOffsetY, 
                player.collisionWidth, 
                player.collisionHeight
            );
        }
        
        // Debug text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('DEBUG MODE - Press B to toggle', 10, 20);
        this.ctx.fillText('P=Power, B=Bomb, D=Detonator', 10, 40);
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, 544, 416);
    }
}