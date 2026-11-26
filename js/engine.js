import level0 from './levels/level0.js';
import level1 from './levels/level1.js';
import level2 from './levels/level2.js';
import level3 from './levels/level3.js';

console.log('Module loaded');

const LEVELS = [level0, level1, level2, level3];

class CaptchaEngine {
    constructor() {
        console.log('Constructor called');
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

        console.log('Elements:', this.content, this.verifyBtn);
        this.verifyBtn.addEventListener('click', () => this.handleVerify());

        this.init();
    }

    init() {
        console.log('Init called');
        this.showLevel(0);
    }

    loadLevel(index) {
        if (index >= LEVELS.length) {
            this.showFinalScreen();
            return;
        }

        this.currentLevelIndex = index;
        this.isTransitioning = false;
        this.verifyBtnEnabled = false;
        this.updateProgressBar();

        const level = LEVELS[index];
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
            getTotalLevels: () => LEVELS.length,
            getProgress: () => ((this.currentLevelIndex) / LEVELS.length) * 100
        };
    }

    handleVerify() {
        console.log('handleVerify called', { verifyBtnEnabled: this.verifyBtnEnabled, isTransitioning: this.isTransitioning });
        if (this.isTransitioning) return;

        if (this.currentLevel?.verify) {
            console.log('Calling level verify');
            this.currentLevel.verify(this.getEngineAPI());
        } else {
            console.log('No verify function available');
        }
    }

    handlePass() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.card.classList.add('success');
        this.verifyBtnEnabled = false;
        this.verifyBtn.disabled = true;

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
        if (index >= LEVELS.length) {
            this.showFinalScreen();
            return;
        }

        this.currentLevelIndex = index;
        this.isTransitioning = false;
        this.verifyBtnEnabled = false;
        this.updateProgressBar();

        const level = LEVELS[index];
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

    updateProgressBar() {
        const progress = ((this.currentLevelIndex) / LEVELS.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${this.currentLevelIndex} / ${LEVELS.length}`;
    }

    showFinalScreen() {
        this.card.style.display = 'none';
        this.finalScreen.classList.add('visible');
        this.launchConfetti();

        const riddleSubmitBtn = document.getElementById('riddleSubmitBtn');
        const riddleFeedback = document.getElementById('riddleFeedback');

        if (riddleSubmitBtn && riddleFeedback) {
            riddleSubmitBtn.addEventListener('click', () => {
                const answer = riddleFeedback.previousElementSibling.value;
                if (answer.trim()) {
                    riddleFeedback.textContent = 'Réponse reçue ! Merry Christmas ! 🎄';
                    riddleFeedback.style.color = '#2e7d32';
                    riddleSubmitBtn.disabled = true;
                    riddleSubmitBtn.textContent = 'Reçu';
                } else {
                    riddleFeedback.textContent = 'Veuillez entrer une réponse avant de soumettre.';
                    riddleFeedback.style.color = '#d93025';
                }
            });
        }
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
