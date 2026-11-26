import level0 from './levels/level0.js';
import level1 from './levels/level1.js';
import level2 from './levels/level2.js';
import level3 from './levels/level3.js';
import level4 from './levels/level4.js';
import level5 from './levels/level5.js';


const PHASE_1_LEVELS = [level0, level2, level1, level4];


const PHASE_2_LEVELS = [level3, level5];


const ENCRYPTED_RIDDLE = [
    76, 136, 57, 211, 173, 138, 229, 92, 18, 254, 78, 238, 182, 97, 69, 232,
    207, 13, 99, 222, 36, 0, 153, 82, 92, 74, 79, 38, 19, 191, 104, 74,
    162, 229, 243, 88, 145, 73, 48, 239, 6, 146, 229, 120, 241, 111, 93, 169,
    252, 11, 66, 219, 141, 95, 208, 80, 141, 212, 82, 126, 209, 19, 212, 94,
    233, 142, 227, 10, 24, 116, 183, 99, 83, 217, 32, 237, 183, 125, 130, 168,
    247, 91, 79, 126, 87, 74, 99, 59, 147, 80, 229, 133, 49, 96, 107, 32,
    48, 116, 137, 227, 15, 35, 26, 214, 102, 74, 201, 179, 46, 248, 240, 123,
    7, 224, 139, 190, 162, 10, 116, 31, 3, 56, 195, 85, 208, 15, 178, 106,
    214, 120, 194, 99, 41, 102, 112, 175, 82, 92, 164, 197
];

class CaptchaEngine {
    #proofs = [];
    constructor() {
        this.currentPhase = 1;
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        this.verifyBtnEnabled = false;
        this.isTransitioning = false;

        this.card = document.getElementById('captchaCard');
        this.title = document.getElementById('captchaTitle');
        this.subtitle = document.getElementById('captchaSubtitle');
        this.content = document.getElementById('captchaContent');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.finalScreen = document.getElementById('finalScreen');

        this.injectTransitionStyles();
        this.verifyBtn.addEventListener('click', () => this.handleVerify());

        this.init();
    }

    init() {
        this.showLevel(0);
    }

    getActiveLevels() {
        return this.currentPhase === 1 ? PHASE_1_LEVELS : PHASE_2_LEVELS;
    }

    injectTransitionStyles() {
        if (document.getElementById('engine-transition-styles')) return;
        const style = document.createElement('style');
        style.id = 'engine-transition-styles';
        style.textContent = `
            .phase-transition-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 24px 12px;
                gap: 14px;
            }
            .phase-loader-bar {
                width: 100%;
                height: 12px;
                background: #e0e0e0;
                border-radius: 6px;
                overflow: hidden;
            }
            .phase-loader-fill {
                width: 0%;
                height: 100%;
                background: #1a73e8;
                transition: width 0.45s ease, background-color 0.3s ease;
            }
            .phase-loader-fill.phase-suspicious {
                background: #d93025;
            }
            .phase-loader-status {
                font-size: 13px;
                color: #555;
                min-height: 20px;
            }
            .phase-twist-icon {
                font-size: 42px;
                line-height: 1;
            }
            .phase-twist-title {
                font-size: 16px;
                font-weight: 700;
                color: #d93025;
                margin: 0;
            }
            .phase-twist-text {
                font-size: 14px;
                color: #333;
                line-height: 1.5;
                margin: 0;
            }
            .phase-continue-btn {
                margin-top: 6px;
                padding: 10px 20px;
                background: #1a73e8;
                color: #fff;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s;
            }
            .phase-continue-btn:hover {
                background: #1557b0;
            }
        `;
        document.head.appendChild(style);
    }

    getEngineAPI() {
        return {
            pass: () => this.handlePass(),
            fail: (message) => this.handleFail(message),
            setVerifyButtonEnabled: (enabled) => {
                this.verifyBtnEnabled = enabled;
                this.verifyBtn.disabled = !enabled;
                if (enabled) {
                    this.verifyBtn.classList.add('success-state');
                    this.verifyBtn.textContent = 'VÉRIFIER';
                } else {
                    this.verifyBtn.classList.remove('success-state');
                    this.verifyBtn.textContent = 'VÉRIFIER';
                }
            },
            getCurrentLevelIndex: () => this.currentLevelIndex,
            getTotalLevels: () => this.getActiveLevels().length,
            getProgress: () => (this.currentLevelIndex / this.getActiveLevels().length) * 100
        };
    }

    handleVerify() {
        if (this.isTransitioning) return;

        if (this.currentLevel?.verify) {
            this.currentLevel.verify(this.getEngineAPI());
        }
    }

    handlePass() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        if (this.currentLevel?.id && !this.#proofs.includes(this.currentLevel.id)) {
            this.#proofs.push(this.currentLevel.id);
        }

        this.card.classList.add('success');
        this.verifyBtnEnabled = false;
        this.verifyBtn.disabled = true;

        // Met visuellement la barre à jour (permet d'afficher 4/4 et 100% à la fin de la phase 1)
        this.updateProgressBar(this.currentLevelIndex + 1);

        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Vérification réussie !';
        this.content.appendChild(successMsg);

        setTimeout(() => {
            this.card.classList.remove('success');
            this.showLevel(this.currentLevelIndex + 1);
        }, 1200);
    }

    showLevel(index) {
        const levels = this.getActiveLevels();

        if (index >= levels.length) {
            if (this.currentPhase === 1 && PHASE_2_LEVELS.length > 0) {
                this.showPhaseTransition();
            } else {
                this.showFinalScreen();
            }
            return;
        }

        this.currentLevelIndex = index;
        this.isTransitioning = false;
        this.verifyBtnEnabled = false;
        this.verifyBtn.style.display = '';
        this.verifyBtn.disabled = true;
        this.verifyBtn.classList.remove('success-state');
        this.verifyBtn.textContent = 'VÉRIFIER';
        this.updateProgressBar(this.currentLevelIndex);

        const level = levels[index];
        this.title.textContent = level.title;

        if (level.subtitle) {
            this.subtitle.textContent = level.subtitle;
            this.subtitle.style.display = 'block';
        } else {
            this.subtitle.style.display = 'none';
        }

        if (this.currentLevel) {
            this.currentLevel.unmount?.();
        }

        this.currentLevel = level;
        this.content.innerHTML = '';
        level.mount(this.content, this.getEngineAPI());
    }

    showPhaseTransition() {
        if (this.currentLevel) {
            this.currentLevel.unmount?.();
            this.currentLevel = null;
        }

        this.isTransitioning = true;
        this.verifyBtn.style.display = 'none';
        this.title.textContent = 'Finalisation de la vérification...';
        this.subtitle.style.display = 'none';
        this.content.innerHTML = '';

        const box = document.createElement('div');
        box.className = 'phase-transition-box';

        const bar = document.createElement('div');
        bar.className = 'phase-loader-bar';
        const fill = document.createElement('div');
        fill.className = 'phase-loader-fill';
        bar.appendChild(fill);

        const status = document.createElement('div');
        status.className = 'phase-loader-status';
        status.textContent = 'Analyse de vos réponses...';

        box.appendChild(bar);
        box.appendChild(status);
        this.content.appendChild(box);

        // Étapes de la fausse barre de chargement
        const steps = [
            { delay: 200, width: '28%', text: 'Analyse de vos mouvements de souris...' },
            { delay: 1100, width: '64%', text: 'Calcul de votre probabilité d\'être un robot...' },
            { delay: 2100, width: '92%', text: 'Déverrouillage de l\'énigme de Noël...' },
            { delay: 3000, width: '98%', text: 'Presque terminé...' }
        ];

        steps.forEach(step => {
            setTimeout(() => {
                fill.style.width = step.width;
                status.textContent = step.text;
            }, step.delay);
        });

        // Révélation du twist après une petite pause à 98%
        setTimeout(() => {
            fill.classList.add('phase-suspicious');
            this.card.classList.add('shake');
            setTimeout(() => this.card.classList.remove('shake'), 500);

            this.title.textContent = 'Vérification supplémentaire requise';
            box.innerHTML = `
                <div class="phase-twist-icon">🤨</div>
                <p class="phase-twist-title">Attendez une seconde...</p>
                <p class="phase-twist-text">
                    Je ne suis pas encore sûr que vous êtes bien humain.<br>
                    J'ai préparé des tests que seuls des humains pourraient réussir.
                </p>
                <button type="button" class="phase-continue-btn" id="phase2StartBtn">
                    Prouver mon humanité
                </button>
            `;

            const startBtn = document.getElementById('phase2StartBtn');
            startBtn.addEventListener('click', () => {
                this.currentPhase = 2;
                this.showLevel(0);
            });
        }, 4300);
    }

    handleFail(message) {
        if (this.isTransitioning) return;

        this.card.classList.add('shake');
        setTimeout(() => this.card.classList.remove('shake'), 500);

        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message || 'Échec de la vérification. Réessayez.';

        const existingError = this.content.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        this.content.appendChild(errorMsg);

        setTimeout(() => {
            if (errorMsg.parentNode) {
                errorMsg.remove();
            }
        }, 4000);
    }

    updateProgressBar(completedCount = this.currentLevelIndex) {
        const total = this.getActiveLevels().length;
        const progress = (completedCount / total) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${completedCount} / ${total}`;
    }

    #decryptRiddle() {
        const keyBytes = new TextEncoder().encode(this.#proofs.join('|'));
        if (keyBytes.length === 0) return 'Accès refusé : terminez d\'abord les épreuves !';

        const out = new Uint8Array(ENCRYPTED_RIDDLE.length);
        let s = 137;
        for (let i = 0; i < ENCRYPTED_RIDDLE.length; i++) {
            const k = keyBytes[i % keyBytes.length];
            s = (s * 31 + k + i) & 0xFF;
            out[i] = ENCRYPTED_RIDDLE[i] ^ s;
        }
        return new TextDecoder().decode(out);
    }

    showFinalScreen() {
        if (this.currentLevel) {
            this.currentLevel.unmount?.();
            this.currentLevel = null;
        }

        const riddleTextEl = document.getElementById('riddleText');
        if (riddleTextEl) {
            riddleTextEl.textContent = this.#decryptRiddle();
        }

        this.card.style.display = 'none';
        this.finalScreen.classList.add('visible');
        this.launchConfetti();
    }

    launchConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        const colors = ['#c0392b', '#2e7d32', '#1a73e8', '#f9a825', '#e91e63', '#00bcd4'];

        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.animationDuration = `${2 + Math.random() * 2}s`;
            piece.style.width = `${6 + Math.random() * 8}px`;
            piece.style.height = `${6 + Math.random() * 8}px`;
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 5000);
    }
}

// ES modules are deferred, so DOM is ready when this executes
new CaptchaEngine();