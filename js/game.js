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
        this.p3BombsEl = document.getElementById('p3-bombs');
        this.p3PowerEl = document.getElementById('p3-power');
        this.player3Toggle = document.getElementById('enablePlayer3');
        this.player3Panel = document.getElementById('player3Panel');
        this.controlLabels = {
            1: document.getElementById('p1-controls'),
            2: document.getElementById('p2-controls'),
            3: document.getElementById('p3-controls')
        };
        
        this.initializeEventListeners();
        this.initializeCommandEditors();
        this.updateControlLabels();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Restart button
        this.restartButton.addEventListener('click', () => this.restart());
        this.player3Toggle.addEventListener('change', () => {
            this.player3Panel.classList.toggle('disabled', !this.player3Toggle.checked);
        });
        
        // Debug mode
        this.debugMode = false;
        this.debugSequence = 'debug';
        this.debugInputBuffer = '';
        
        // Global key listeners for game control
        document.addEventListener('keydown', (e) => {
            if (ControlConfig.isEditorEvent(e) || ControlConfig.isToggleActivationEvent(e) || ControlConfig.activeCapture) return;

            const key = e.key.toLowerCase();

            if (key.length === 1 && /^[a-z]$/.test(key)) {
                this.debugInputBuffer = (this.debugInputBuffer + key).slice(-this.debugSequence.length);
                if (this.debugInputBuffer === this.debugSequence) {
                    this.debugMode = !this.debugMode;
                    this.gameStatusEl.textContent = this.debugMode ? 'Debug mode enabled' : 'Debug mode disabled';
                    console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
                }
            }

            // Start game on any key if in menu state.
            if (this.gameState === 'menu') {
                this.startGame();
            }
        });
    }

    /**
     * Build the per-player command editors in the player boxes.
     */
    initializeCommandEditors() {
        document.querySelectorAll('.edit-commands-button').forEach((button) => {
            button.addEventListener('click', () => {
                const playerType = button.dataset.player;
                const editor = document.getElementById(`p${playerType}-command-editor`);
                const isOpening = editor.classList.contains('hidden');
                ControlConfig.activeCapture = null;

                document.querySelectorAll('.command-editor').forEach((panel) => {
                    panel.classList.toggle('hidden', panel !== editor || !isOpening);
                });

                document.querySelectorAll('.edit-commands-button').forEach((editorButton) => {
                    editorButton.textContent = editorButton === button && isOpening
                        ? 'Close commands'
                        : 'Edit commands';
                });

                this.renderCommandEditor(playerType);
            });
        });
    }

    renderCommandEditor(playerType) {
        const editor = document.getElementById(`p${playerType}-command-editor`);
        editor.innerHTML = '';

        const commandList = document.createElement('div');
        commandList.className = 'command-list';

        for (const action of ControlConfig.actions) {
            commandList.appendChild(this.createCommandRow(playerType, action));
        }

        const footer = document.createElement('div');
        footer.className = 'command-editor-footer';

        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.className = 'secondary-command-button';
        resetButton.textContent = 'Reset player defaults';
        resetButton.addEventListener('click', () => {
            ControlConfig.resetPlayer(playerType);
            this.inputHandler?.reset();
            this.updateControlLabels();
            this.renderCommandEditor(playerType);
        });

        footer.appendChild(resetButton);
        editor.appendChild(commandList);
        editor.appendChild(footer);
    }

    createCommandRow(playerType, action) {
        const row = document.createElement('div');
        row.className = 'command-row';

        const label = document.createElement('label');
        label.textContent = action.label;
        label.setAttribute('for', `p${playerType}-${action.id}-manual`);

        const captureButton = document.createElement('button');
        captureButton.type = 'button';
        captureButton.className = 'command-key-button';
        captureButton.textContent = ControlConfig.formatKeyCode(ControlConfig.getBinding(playerType, action.id));
        captureButton.addEventListener('click', () => {
            ControlConfig.activeCapture = { playerType, actionId: action.id };
            captureButton.textContent = 'Press key...';
            captureButton.classList.add('capturing');
            captureButton.focus();
        });

        captureButton.addEventListener('keydown', (event) => {
            if (!ControlConfig.activeCapture) return;

            event.preventDefault();
            event.stopPropagation();
            this.setCommandBinding(playerType, action.id, event.code);
        });

        const manualInput = document.createElement('input');
        manualInput.id = `p${playerType}-${action.id}-manual`;
        manualInput.type = 'text';
        manualInput.value = ControlConfig.getBinding(playerType, action.id);
        manualInput.placeholder = 'KeyW';
        manualInput.spellcheck = false;

        const setButton = document.createElement('button');
        setButton.type = 'button';
        setButton.className = 'secondary-command-button';
        setButton.textContent = 'Set';
        setButton.addEventListener('click', () => {
            this.setCommandBinding(playerType, action.id, manualInput.value);
        });

        manualInput.addEventListener('keydown', (event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
                this.setCommandBinding(playerType, action.id, manualInput.value);
            }
        });

        row.appendChild(label);
        row.appendChild(captureButton);
        row.appendChild(manualInput);
        row.appendChild(setButton);

        return row;
    }

    setCommandBinding(playerType, actionId, keyCode) {
        const saved = ControlConfig.setBinding(playerType, actionId, keyCode);
        ControlConfig.activeCapture = null;

        if (saved) {
            this.inputHandler?.reset();
            this.updateControlLabels();
        }

        this.renderCommandEditor(playerType);
    }

    updateControlLabels() {
        for (const playerType of Object.keys(this.controlLabels)) {
            this.controlLabels[playerType].textContent = ControlConfig.getPlayerSummary(playerType);
        }
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
        const enabledPlayerTypes = this.getEnabledPlayerTypes();
        this.map.generate(this.debugMode, enabledPlayerTypes);
        
        // Initialize players
        this.players = enabledPlayerTypes.map((playerType) => {
            const startPosition = this.getPlayerStartPosition(playerType);
            return new Player(playerType, startPosition.x, startPosition.y);
        });
        
        // Set game state
        this.gameState = 'playing';
        this.gameStatusEl.textContent = 'Game in progress';
        this.player3Toggle.disabled = true;
        this.hideGameOverScreen();
        
        // Start game loop if not already running
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
        
        console.log('Game started');
    }

    getEnabledPlayerTypes() {
        return this.player3Toggle.checked ? [1, 2, 3] : [1, 2];
    }

    getPlayerStartPosition(playerType) {
        return {
            1: { x: 36, y: 32 },
            2: { x: 486, y: 352 },
            3: { x: 486, y: 32 }
        }[playerType];
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

        // On the paused win frame, keep defeated players visible under the flames
        // so the hit that ended the round remains readable.
        if (this.gameState === 'gameOver') {
            for (const player of this.players) {
                if (!player.alive) {
                    this.renderer.renderPlayer(player);
                }
            }
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
        const statElements = {
            1: { bombs: this.p1BombsEl, power: this.p1PowerEl },
            2: { bombs: this.p2BombsEl, power: this.p2PowerEl },
            3: { bombs: this.p3BombsEl, power: this.p3PowerEl }
        };

        for (const player of this.players) {
            const elements = statElements[player.type];
            if (!elements) continue;

            elements.bombs.textContent = player.bombDisp;
            elements.power.textContent = player.power;
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
            this.gameOverMessage.textContent = `Round paused. Dismiss to reset.`;
        } else {
            this.gameOverTitle.textContent = 'Game Over';
            this.gameOverMessage.textContent = 'Tie round paused. Dismiss to reset.';
        }
        
        this.gameStatusEl.textContent = winner ? `Player ${winner.type} wins` : 'Tie game';
        this.player3Toggle.disabled = false;
        this.showGameOverScreen();
        
        // Add delay like original (1.5 seconds)
        setTimeout(() => {
            console.log('Game ended');
        }, 1500);
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
