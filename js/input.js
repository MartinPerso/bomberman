/**
 * Input handler for Bomberman game
 * Manages keyboard input for both players with the same controls as the original C++ version
 */

class InputHandler {
    constructor() {
        this.keyStates = {};
        this.initializeEventListeners();
    }

    /**
     * Initialize keyboard event listeners
     */
    initializeEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keyStates[e.code] = true;
            
            // Prevent default behavior for game keys to avoid page scrolling
            const gameKeys = [
                'KeyW', 'KeyA', 'KeyS', 'KeyD', // Player 1 movement
                'ShiftLeft', 'ControlLeft',      // Player 1 actions
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', // Player 2 movement
                'KeyO', 'KeyP',                  // Player 2 actions
                'KeyM', 'KeyR'                   // Game control
            ];
            
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates[e.code] = false;
        });

        // Handle window focus/blur to reset key states
        window.addEventListener('blur', () => {
            this.keyStates = {};
        });
    }

    /**
     * Get current key states
     * @returns {Object} Key states object
     */
    getKeyStates() {
        return this.keyStates;
    }

    /**
     * Check if a specific key is pressed
     * @param {string} keyCode - Key code to check
     * @returns {boolean} True if key is pressed
     */
    isKeyPressed(keyCode) {
        return !!this.keyStates[keyCode];
    }

    /**
     * Check Player 1 movement keys (matching original WASD controls)
     * @returns {Object} Movement state for Player 1
     */
    getPlayer1Input() {
        return {
            up: this.isKeyPressed('KeyW'),
            down: this.isKeyPressed('KeyS'),
            left: this.isKeyPressed('KeyA'),
            right: this.isKeyPressed('KeyD'),
            bomb: this.isKeyPressed('ShiftLeft'),
            detonate: this.isKeyPressed('ControlLeft')
        };
    }

    /**
     * Check Player 2 movement keys (matching original Arrow controls)
     * @returns {Object} Movement state for Player 2
     */
    getPlayer2Input() {
        return {
            up: this.isKeyPressed('ArrowUp'),
            down: this.isKeyPressed('ArrowDown'),
            left: this.isKeyPressed('ArrowLeft'),
            right: this.isKeyPressed('ArrowRight'),
            bomb: this.isKeyPressed('KeyO'),
            detonate: this.isKeyPressed('KeyP')
        };
    }

    /**
     * Get input for a specific player
     * @param {number} playerType - Player number (1 or 2)
     * @returns {Object} Input state for the player
     */
    getPlayerInput(playerType) {
        if (playerType === 1) {
            return this.getPlayer1Input();
        } else if (playerType === 2) {
            return this.getPlayer2Input();
        }
        return {
            up: false,
            down: false,
            left: false,
            right: false,
            bomb: false,
            detonate: false
        };
    }

    /**
     * Check if any movement key is pressed for a player
     * @param {number} playerType - Player number (1 or 2)
     * @returns {boolean} True if any movement key is pressed
     */
    isPlayerMoving(playerType) {
        const input = this.getPlayerInput(playerType);
        return input.up || input.down || input.left || input.right;
    }

    /**
     * Get the primary movement direction for a player
     * Matches the original C++ priority: up > left > down > right
     * @param {number} playerType - Player number (1 or 2)
     * @returns {string|null} Direction ('up', 'down', 'left', 'right') or null
     */
    getPlayerDirection(playerType) {
        const input = this.getPlayerInput(playerType);
        
        // Priority matching original C++ Player::Update() method
        if (input.up) return 'up';
        if (input.left) return 'left';
        if (input.down) return 'down';
        if (input.right) return 'right';
        
        return null;
    }

    /**
     * Reset all key states (useful for game state changes)
     */
    reset() {
        this.keyStates = {};
    }
}