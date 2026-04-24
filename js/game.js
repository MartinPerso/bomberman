/**
 * Main game controller for HTML Bomberman
 * Handles game loop, state management, and coordination between systems
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver
        this.lastTime = 0;
        this.deltaTime = 0;
        this.running = false;
        
        // Game objects
        this.map = null;
        this.players = [];
        this.renderer = null;
        this.inputHandler = null;
        
        // Game settings (matching original C++ values)
        this.TILE_SIZE = 32;
        this.MAP_WIDTH = 17;
        this.MAP_HEIGHT = 13;
        this.CANVAS_WIDTH = 544; // 17 * 32
        this.CANVAS_HEIGHT = 416; // 13 * 32
        this.MIN_FRAME_TIME = 10; // 10ms minimum frame time (matching original)
        
        // UI elements
        this.gameStatusEl = document.getElementById('gameStatus');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.restartButton = document.getElementById('restartButton');
        
        // Player stat elements
        this.p1BombsEl = document.getElementById('p1-bombs');
        this.p1PowerEl = document.getElementById('p1-power');
        this.p2BombsEl = document.getElementById('p2-bombs');
        this.p2PowerEl = document.getElementById('p2-power');
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Restart button
        this.restartButton.addEventListener('click', () => this.restart());
        
        // Debug mode
        this.debugMode = false;
        this.debugSequence = 'debug';
        this.debugInputBuffer = '';
        
        // Global key listeners for game control
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            if (key.length === 1 && /^[a-z]$/.test(key)) {
                this.debugInputBuffer = (this.debugInputBuffer + key).slice(-this.debugSequence.length);
                if (this.debugInputBuffer === this.debugSequence) {
                    this.debugMode = !this.debugMode;
                    this.gameStatusEl.textContent = this.debugMode ? 'Debug mode enabled' : 'Debug mode disabled';
                    console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
                }
            }

            switch(key) {
                case 'r':
                    this.restart();
                    break;
                case 'm':
                    if (this.gameState === 'playing') {
                        this.pause();
                    } else if (this.gameState === 'paused') {
                        this.resume();
                    }
                    break;
                default:
                    // Start game on any key if in menu state
                    if (this.gameState === 'menu') {
                        this.startGame();
                    }
                    break;
            }
        });
    }

    /**
     * Initialize the game
     */
    async init() {
        try {
            this.gameStatusEl.textContent = 'Loading assets...';
            
            // Load all assets
            await assetLoader.loadAllAssets();
            
            // Initialize game systems
            this.renderer = new Renderer(this.ctx);
            this.inputHandler = new InputHandler();
            
            // Set up initial game state
            this.gameState = 'menu';
            this.gameStatusEl.textContent = 'Press any key to start';
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.gameStatusEl.textContent = 'Failed to load game. Please refresh.';
        }
    }

    /**
     * Start a new game
     */
    startGame() {
        // Initialize map
        this.map = new GameMap(this.MAP_WIDTH, this.MAP_HEIGHT);
        this.map.generate(this.debugMode);
        
        // Initialize players
        this.players = [
            new Player(1, 36, 32),  // Player 1 starting position
            new Player(2, 486, 352) // Player 2 starting position
        ];
        
        // Set game state
        this.gameState = 'playing';
        this.gameStatusEl.textContent = 'Game in progress';
        this.hideGameOverScreen();
        
        // Start game loop if not already running
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
        
        console.log('Game started');
    }

    /**
     * Main game loop (matching original SDL loop structure)
     */
    gameLoop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        
        // Only update if enough time has passed (matching original 10ms minimum)
        if (this.deltaTime >= this.MIN_FRAME_TIME) {
            this.update(this.deltaTime);
            this.render();
            this.lastTime = currentTime;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Reset kill flags each frame (matching original main.cpp line 155)
        if (this.map) {
            this.map.resetKillFlags();
        }
        
        const keyStates = this.inputHandler.getKeyStates();

        // Phase 1a: resolve all bomb explosions globally in one deterministic pass.
        this.resolveBombChains(deltaTime, keyStates);

        // Phase 1b: update and apply all active flames.
        for (const player of this.players) {
            player.updateFlames(deltaTime, this.map);
        }

        // Phase 2: process movement/actions/death checks for all players.
        for (const player of this.players) {
            if (player.alive) {
                player.updatePlayerPhase(deltaTime, this.map, keyStates);
            }
        }
        
        // Check win/lose conditions
        const alivePlayers = this.players.filter(p => p.alive);
        if (alivePlayers.length <= 1) {
            this.endGame(alivePlayers[0] || null);
        }
        
        // Update UI
        this.updatePlayerStats();
    }

    /**
     * Resolve timed/manual/chain bomb explosions across all players in one update.
     * Uses a queue so one bomb explosion can trigger others immediately.
     * @param {number} deltaTime - Time since last update in milliseconds
     * @param {Object} keyStates - Current keyboard state
     */
    resolveBombChains(deltaTime, keyStates) {
        const currentTime = performance.now();
        const queue = [];
        const queuedBombs = new Set();

        const enqueueBomb = (player, bomb) => {
            if (!bomb || bomb.exploded || queuedBombs.has(bomb)) return;
            queuedBombs.add(bomb);
            queue.push({ player, bomb });
        };

        // Existing flames from previous frames can already trigger bombs.
        const existingFlames = this.players
            .flatMap((p) => p.flames)
            .filter((flame) => !flame.isExpired());

        // Seed the queue with bombs that should explode now (timer/manual/existing flames),
        // and keep original "bomb becomes solid once owner leaves tile" behavior.
        for (const player of this.players) {
            const input = player.getPlayerInput(keyStates);

            for (const bomb of player.bombs) {
                bomb.update(currentTime, deltaTime);

                const inExistingFlame = existingFlames.some((flame) =>
                    flame.affectsPosition(bomb.gridRow, bomb.gridCol)
                );
                if (bomb.shouldExplode(currentTime, input.detonate, inExistingFlame)) {
                    enqueueBomb(player, bomb);
                    continue;
                }

                const playerBox = {
                    x: player.x,
                    y: player.y + player.collisionOffsetY,
                    width: player.collisionWidth,
                    height: player.collisionHeight
                };
                const bombBox = {
                    x: bomb.gridCol * 32,
                    y: bomb.gridRow * 32,
                    width: 32,
                    height: 32
                };

                if (!player.boxCollision(playerBox, bombBox)) {
                    const tile = this.map.getTile(bomb.gridRow, bomb.gridCol);
                    if (tile) {
                        tile.crossable = false;
                    }
                }
            }
        }

        // Propagate chain reactions immediately.
        while (queue.length > 0) {
            const { player, bomb } = queue.shift();
            if (bomb.exploded) continue;

            const flame = bomb.explode(this.map, currentTime);
            const bombIndex = player.bombs.indexOf(bomb);
            if (bombIndex !== -1) {
                player.bombs.splice(bombIndex, 1);
            }

            if (!flame) continue;

            player.flames.push(flame);
            flame.applyDamage(this.map);

            // New flame can immediately trigger any bomb it reaches.
            for (const otherPlayer of this.players) {
                for (const otherBomb of otherPlayer.bombs) {
                    if (otherBomb.exploded) continue;
                    if (flame.affectsPosition(otherBomb.gridRow, otherBomb.gridCol)) {
                        enqueueBomb(otherPlayer, otherBomb);
                    }
                }
            }
        }
    }

    /**
     * Render the game
     */
    render() {
        if (!this.renderer || !this.map) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Render background
        this.renderer.renderBackground();
        
        // Render map (matching original render order)
        this.renderer.renderMap(this.map);
        
        // Render bombs for all players
        for (const player of this.players) {
            this.renderer.renderBombs(player.bombs);
        }
        
        // Render flames for all players
        for (const player of this.players) {
            this.renderer.renderFlames(player.flames);
        }
        
        // Render players
        for (const player of this.players) {
            if (player.alive) {
                this.renderer.renderPlayer(player);
            }
        }
        
        // Render debug info if enabled
        if (this.debugMode) {
            this.renderer.renderDebug(this.players, this.map);
        }
    }

    /**
     * Update player statistics display
     */
    updatePlayerStats() {
        if (this.players.length >= 2) {
            this.p1BombsEl.textContent = this.players[0].bombDisp;
            this.p1PowerEl.textContent = this.players[0].power;
            this.p2BombsEl.textContent = this.players[1].bombDisp;
            this.p2PowerEl.textContent = this.players[1].power;
        }
    }

    /**
     * End the game
     * @param {Player|null} winner - Winning player or null for tie
     */
    endGame(winner) {
        this.gameState = 'gameOver';
        
        if (winner) {
            this.gameOverTitle.textContent = `Player ${winner.type} Wins!`;
            this.gameOverMessage.textContent = `Congratulations Player ${winner.type}!`;
        } else {
            this.gameOverTitle.textContent = 'Game Over';
            this.gameOverMessage.textContent = 'It\'s a tie!';
        }
        
        this.gameStatusEl.textContent = 'Game Over - Press R to restart';
        this.showGameOverScreen();
        
        // Add delay like original (1.5 seconds)
        setTimeout(() => {
            console.log('Game ended');
        }, 1500);
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.gameStatusEl.textContent = 'Game Paused - Press M to resume';
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameStatusEl.textContent = 'Game in progress';
            this.lastTime = performance.now(); // Reset timing
        }
    }

    /**
     * Restart the game
     */
    restart() {
        if (this.inputHandler) {
            this.inputHandler.reset();
        }
        this.hideGameOverScreen();
        this.startGame();
    }

    /**
     * Show game over screen
     */
    showGameOverScreen() {
        this.gameOverScreen.classList.remove('hidden');
    }

    /**
     * Hide game over screen
     */
    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
    }
}

// Initialize and start the game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    await game.init();
    
    // Make game globally accessible for debugging
    window.game = game;
});