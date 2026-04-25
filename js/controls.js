/**
 * Shared player command bindings.
 * Keeps gameplay and the controls editor reading from the same key map.
 */
const ControlConfig = {
    storageKey: 'bomberman.controls',
    actions: [
        { id: 'up', label: 'Up' },
        { id: 'down', label: 'Down' },
        { id: 'left', label: 'Left' },
        { id: 'right', label: 'Right' },
        { id: 'bomb', label: 'Bomb' },
        { id: 'detonate', label: 'Detonate' }
    ],
    defaults: {
        1: {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            bomb: 'ShiftLeft',
            detonate: 'ControlLeft'
        },
        2: {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            bomb: 'KeyO',
            detonate: 'KeyP'
        },
        3: {
            up: 'KeyT',
            down: 'KeyG',
            left: 'KeyF',
            right: 'KeyH',
            bomb: 'KeyR',
            detonate: 'KeyY'
        }
    },
    bindings: null,
    activeCapture: null,

    load() {
        const savedBindings = this.readSavedBindings();
        this.bindings = this.mergeWithDefaults(savedBindings);
        return this.bindings;
    },

    readSavedBindings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.warn('Could not read saved controls:', error);
            return null;
        }
    },

    mergeWithDefaults(savedBindings) {
        const nextBindings = {};
        for (const playerType of Object.keys(this.defaults)) {
            nextBindings[playerType] = { ...this.defaults[playerType] };
            if (!savedBindings || !savedBindings[playerType]) continue;

            for (const action of this.actions) {
                const keyCode = savedBindings[playerType][action.id];
                if (this.isValidKeyCode(keyCode)) {
                    nextBindings[playerType][action.id] = keyCode;
                }
            }
        }
        return nextBindings;
    },

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bindings));
        } catch (error) {
            console.warn('Could not save controls:', error);
        }
    },

    resetPlayer(playerType) {
        this.bindings[playerType] = { ...this.defaults[playerType] };
        this.save();
    },

    setBinding(playerType, actionId, keyCode) {
        if (!this.isValidKeyCode(keyCode)) {
            return false;
        }

        this.bindings[playerType][actionId] = keyCode.trim();
        this.save();
        return true;
    },

    getBinding(playerType, actionId) {
        return this.bindings?.[playerType]?.[actionId] || this.defaults[playerType][actionId];
    },

    getPlayerInput(playerType, keyStates) {
        const playerBindings = this.bindings?.[playerType] || this.defaults[playerType];
        const input = {};
        for (const action of this.actions) {
            input[action.id] = !!keyStates[playerBindings[action.id]];
        }
        return input;
    },

    getPreventedKeyCodes() {
        const keyCodes = [];
        for (const playerBindings of Object.values(this.bindings || this.defaults)) {
            keyCodes.push(...Object.values(playerBindings));
        }
        return keyCodes;
    },

    isValidKeyCode(keyCode) {
        return typeof keyCode === 'string' && keyCode.trim().length > 0;
    },

    isEditorEvent(event) {
        return event.target instanceof Element &&
            !!event.target.closest('.command-editor, .edit-commands-button');
    },

    isToggleActivationEvent(event) {
        return event.target instanceof Element &&
            !!event.target.closest('.player-toggle') &&
            (event.code === 'Space' || event.code === 'Enter');
    },

    formatKeyCode(keyCode) {
        const labels = {
            ArrowUp: 'Arrow Up',
            ArrowDown: 'Arrow Down',
            ArrowLeft: 'Arrow Left',
            ArrowRight: 'Arrow Right',
            ShiftLeft: 'Left Shift',
            ShiftRight: 'Right Shift',
            ControlLeft: 'Left Ctrl',
            ControlRight: 'Right Ctrl',
            Space: 'Space',
            Enter: 'Enter',
            Escape: 'Esc',
            Backspace: 'Backspace',
            Tab: 'Tab'
        };

        if (labels[keyCode]) return labels[keyCode];
        if (/^Key[A-Z]$/.test(keyCode)) return keyCode.replace('Key', '');
        if (/^Digit[0-9]$/.test(keyCode)) return keyCode.replace('Digit', '');
        return keyCode.replace(/([a-z])([A-Z])/g, '$1 $2');
    },

    getPlayerSummary(playerType) {
        const playerNumber = Number(playerType);
        let movement;
        if (this.isDefaultPlayer(playerType)) {
            movement = {
                1: 'WASD',
                2: 'Arrows',
                3: 'TFGH'
            }[playerNumber];
        } else {
            movement = ['up', 'down', 'left', 'right']
                .map((actionId) => this.formatKeyCode(this.getBinding(playerType, actionId)))
                .join('/');
        }

        return `${movement} + ${this.formatKeyCode(this.getBinding(playerType, 'bomb'))} (bomb) + ${this.formatKeyCode(this.getBinding(playerType, 'detonate'))} (detonate)`;
    },

    isDefaultPlayer(playerType) {
        return this.actions.every((action) =>
            this.getBinding(playerType, action.id) === this.defaults[playerType][action.id]
        );
    }
};

ControlConfig.load();
