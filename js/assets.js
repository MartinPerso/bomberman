/**
 * Asset loader for Bomberman game
 * Handles loading and caching of sprite images with transparency support
 */

class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.loadPromises = new Map();
        this.spriteData = this.initializeSpriteData();
    }

    /**
     * Initialize sprite data with crop rectangles matching the original C++ code
     */
    initializeSpriteData() {
        return {
            // Player 1 sprites (from Player.cpp)
            player1: {
                up1: { x: 1, y: 0, w: 17, h: 33 },
                up2: { x: 18, y: 0, w: 18, h: 33 },
                up3: { x: 1, y: 0, w: 18, h: 33 },
                up4: { x: 36, y: 0, w: 17, h: 33 },
                
                down1: { x: 51 + 18*3, y: 0, w: 17, h: 33 },
                down2: { x: 68 + 18*3, y: 0, w: 17, h: 33 },
                down3: { x: 51 + 18*3, y: 0, w: 18, h: 33 },
                down4: { x: 85 + 18*3, y: 0, w: 17, h: 33 },
                
                left1: { x: 102 + 18*3, y: 0, w: 18, h: 33 },
                left2: { x: 102 + 18*4, y: 0, w: 18, h: 33 },
                left3: { x: 102 + 18*3, y: 0, w: 19, h: 33 },
                left4: { x: 102 + 18*5, y: 0, w: 18, h: 33 },
                
                right1: { x: 51, y: 0, w: 18, h: 33 },
                right2: { x: 51 + 18, y: 0, w: 18, h: 33 },
                right3: { x: 51, y: 0, w: 19, h: 33 },
                right4: { x: 51 + 18*2, y: 0, w: 18, h: 33 }
            },
            
            // Player 2 uses same sprite layout as player 1
            player2: {
                up1: { x: 1, y: 0, w: 17, h: 33 },
                up2: { x: 18, y: 0, w: 18, h: 33 },
                up3: { x: 1, y: 0, w: 18, h: 33 },
                up4: { x: 36, y: 0, w: 17, h: 33 },
                
                down1: { x: 51 + 18*3, y: 0, w: 17, h: 33 },
                down2: { x: 68 + 18*3, y: 0, w: 17, h: 33 },
                down3: { x: 51 + 18*3, y: 0, w: 18, h: 33 },
                down4: { x: 85 + 18*3, y: 0, w: 17, h: 33 },
                
                left1: { x: 102 + 18*3, y: 0, w: 18, h: 33 },
                left2: { x: 102 + 18*4, y: 0, w: 18, h: 33 },
                left3: { x: 102 + 18*3, y: 0, w: 19, h: 33 },
                left4: { x: 102 + 18*5, y: 0, w: 18, h: 33 },
                
                right1: { x: 51, y: 0, w: 18, h: 33 },
                right2: { x: 51 + 18, y: 0, w: 18, h: 33 },
                right3: { x: 51, y: 0, w: 19, h: 33 },
                right4: { x: 51 + 18*2, y: 0, w: 18, h: 33 }
            },
            
            // Bomb sprites (from Bomb.cpp)
            bomb: {
                frame1: { x: 17, y: 0, w: 17, h: 17 },
                frame2: { x: 36, y: 0, w: 18, h: 17 }
            },
            
            // Flame sprites (from Flames.cpp)
            flames: {
                leftEnd: { x: 0, y: 0, w: 32, h: 32 },
                rightEnd: { x: 33, y: 0, w: 32, h: 32 },
                upEnd: { x: 66, y: 0, w: 32, h: 32 },
                downEnd: { x: 99, y: 0, w: 32, h: 32 },
                center: { x: 132, y: 0, w: 32, h: 32 },
                horizontal: { x: 165, y: 0, w: 32, h: 32 },
                vertical: { x: 198, y: 0, w: 32, h: 32 }
            },
            
            // Bonus sprites (from Bonus.cpp)
            bonus: {
                power: { x: 0, y: 0, w: 32, h: 32 },
                extraBomb: { x: 33, y: 0, w: 32, h: 32 },
                detonator: { x: 66, y: 0, w: 32, h: 32 }
            },
            
            // Tile sprites (32x32 each)
            tiles: {
                square: { x: 0, y: 0, w: 32, h: 32 },
                wall: { x: 0, y: 0, w: 32, h: 32 },
                box: { x: 0, y: 0, w: 32, h: 32 }
            },
            
            // Background
            background: { x: 0, y: 0, w: 544, h: 416 }
        };
    }

    /**
     * Load an image asset
     * @param {string} name - Asset name (without extension)
     * @param {string} path - Path to the image file
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImage(name, path) {
        if (this.assets.has(name)) {
            return this.assets.get(name);
        }

        if (this.loadPromises.has(name)) {
            return this.loadPromises.get(name);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // Process transparency - convert green (0,160,0) to transparent
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                // Get image data and process transparency
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Convert green (0,160,0) pixels to transparent
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Check for the transparency color key (0,160,0)
                    if (r === 0 && g === 160 && b === 0) {
                        data[i + 3] = 0; // Set alpha to 0 (transparent)
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                // Create new image from processed canvas
                const processedImg = new Image();
                processedImg.onload = () => {
                    this.assets.set(name, processedImg);
                    resolve(processedImg);
                };
                processedImg.src = canvas.toDataURL();
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${path}`));
            };
            
            img.src = path;
        });

        this.loadPromises.set(name, promise);
        return promise;
    }

    /**
     * Load all game assets
     * @returns {Promise<void>}
     */
    async loadAllAssets() {
        const assetList = [
            { name: 'background', path: 'assets/Background.png' },
            { name: 'player1', path: 'assets/player1.png' },
            { name: 'player2', path: 'assets/player2.png' },
            { name: 'bomb', path: 'assets/bomb.png' },
            { name: 'flames', path: 'assets/Flames.png' },
            { name: 'wall', path: 'assets/wall.png' },
            { name: 'box', path: 'assets/box.png' },
            { name: 'square', path: 'assets/square.png' },
            { name: 'bonus', path: 'assets/Bonus.png' }
        ];

        const loadPromises = assetList.map(asset => 
            this.loadImage(asset.name, asset.path)
        );

        await Promise.all(loadPromises);
        console.log('All assets loaded successfully');
    }

    /**
     * Get a loaded asset
     * @param {string} name - Asset name
     * @returns {HTMLImageElement|null}
     */
    getAsset(name) {
        return this.assets.get(name) || null;
    }

    /**
     * Get sprite data for a specific asset and sprite
     * @param {string} assetName - Asset name (e.g., 'player1')
     * @param {string} spriteName - Sprite name (e.g., 'up1')
     * @returns {Object|null} Sprite rectangle {x, y, w, h}
     */
    getSpriteData(assetName, spriteName) {
        const assetSprites = this.spriteData[assetName];
        if (!assetSprites) return null;
        return assetSprites[spriteName] || null;
    }

    /**
     * Check if all assets are loaded
     * @returns {boolean}
     */
    isAllLoaded() {
        return this.assets.size >= 9; // We expect 9 main assets
    }
}

// Global asset loader instance
const assetLoader = new AssetLoader();