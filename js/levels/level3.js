export default {
    id: 'level3',
    title: "Prouvez que vous êtes humain en déclarant la guerre",
    subtitle: 'Tirez avec votre sniper sur l\'archiduc François-Ferdinand. 30 secondes seulement !',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.timer = null;
        this.timeLeft = 30;
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.ferdinandRect = null;
        this.isResetting = false;
        this.mouseX = 0;
        this.mouseY = 0;

        const gameContainer = document.createElement('div');
        gameContainer.className = 'level3-game-container';

        const timerBar = document.createElement('div');
        timerBar.className = 'level3-timer-bar';
        this.timerBarFill = document.createElement('div');
        this.timerBarFill.className = 'level3-timer-fill';
        timerBar.appendChild(this.timerBarFill);
        this.timerText = document.createElement('div');
        this.timerText.className = 'level3-timer-text';
        this.timerText.textContent = '30s';
        timerBar.appendChild(this.timerText);
        gameContainer.appendChild(timerBar);

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'level3-image-wrapper';

        const waldoImage = document.createElement('img');
        waldoImage.className = 'level3-waldo-bg';
        waldoImage.src = 'asset/where_is_waldo.jpg';
        waldoImage.alt = 'Où est Charlie ?';
        waldoImage.draggable = false;

        const ferdinandImg = document.createElement('img');
        ferdinandImg.className = 'level3-ferdinand';
        ferdinandImg.src = 'asset/ferdinand.png';
        ferdinandImg.draggable = false;
        this.ferdinandImg = ferdinandImg;

        const scopeCursor = document.createElement('div');
        scopeCursor.className = 'level3-scope-cursor';
        this.scopeCursor = scopeCursor;

        imageWrapper.appendChild(waldoImage);
        imageWrapper.appendChild(ferdinandImg);
        imageWrapper.appendChild(scopeCursor);
        gameContainer.appendChild(imageWrapper);
        container.appendChild(gameContainer);

        waldoImage.addEventListener('dragstart', (e) => e.preventDefault());
        ferdinandImg.addEventListener('dragstart', (e) => e.preventDefault());

        waldoImage.onload = () => {
            this.positionFerdinand();
        };

        waldoImage.onerror = () => {
            ferdinandImg.style.display = 'none';
            waldoImage.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'level3-error-msg';
            errorMsg.textContent = 'Erreur de chargement des images. Rechargez la page.';
            imageWrapper.appendChild(errorMsg);
        };

        this.setupMouseTracking(imageWrapper);
        this.setupZoom(imageWrapper);
        this.setupClick(imageWrapper, waldoImage, ferdinandImg);
        this.startTimer();
    },

    positionFerdinand() {
        if (!this.ferdinandImg) return;

        const wrapper = this.ferdinandImg.parentElement;
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const containerWidth = wrapperRect.width;
        const containerHeight = wrapperRect.height;

        const imgScale = Math.min(120 / containerHeight, 120 / containerWidth);
        const ferdWidth = 160 * imgScale;
        const ferdHeight = 200 * imgScale;

        const margin = 40;
        const maxX = containerWidth - ferdWidth - margin;
        const maxY = containerHeight - ferdHeight - margin;

        const randomX = Math.random() * maxX + margin / 2;
        const randomY = Math.random() * maxY + margin / 2;

        this.ferdinandImg.style.width = `${ferdWidth}px`;
        this.ferdinandImg.style.height = `${ferdHeight}px`;
        this.ferdinandImg.style.left = `${randomX}px`;
        this.ferdinandImg.style.top = `${randomY}px`;
        this.ferdinandImg.style.display = 'block';

        this.ferdinandRect = {
            left: randomX,
            right: randomX + ferdWidth,
            top: randomY,
            bottom: randomY + ferdHeight
        };
    },

    setupMouseTracking(wrapper) {
        const handleMove = (e) => {
            const rect = wrapper.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.updateScopePosition();
        };

        document.addEventListener('mousemove', handleMove);

        this.cleanupMouse = () => {
            document.removeEventListener('mousemove', handleMove);
        };
    },

    updateScopePosition() {
        if (!this.scopeCursor) return;
        this.scopeCursor.style.left = `${this.mouseX}px`;
        this.scopeCursor.style.top = `${this.mouseY}px`;
    },

    setupZoom(wrapper) {
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            this.scale = Math.max(1, Math.min(5, this.scale + delta));
            this.updateTransform();
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.key === '+' || e.key === '=') {
                this.scale = Math.min(5, this.scale + 0.3);
                this.updateTransform();
            } else if (e.key === '-') {
                this.scale = Math.max(1, this.scale - 0.3);
                this.updateTransform();
            }
        });
    },

    updateTransform() {
        const wrapper = this.scopeCursor.parentElement;
        if (!wrapper) return;

        const bg = wrapper.querySelector('.level3-waldo-bg');
        const ferd = wrapper.querySelector('.level3-ferdinand');

        if (bg) {
            bg.style.transform = `scale(${this.scale}) translate(${this.panX}px, ${this.panY}px)`;
        }
        if (ferd) {
            ferd.style.transform = `scale(${this.scale})`;
        }
    },

    setupClick(wrapper, waldoImg, ferdinandImg) {
        wrapper.addEventListener('click', (e) => {
            if (this.isResetting || !this.ferdinandRect) return;

            const wrapperRect = wrapper.getBoundingClientRect();
            const clickX = e.clientX - wrapperRect.left;
            const clickY = e.clientY - wrapperRect.top;

            const adjustedX = (clickX - wrapperRect.width / 2) / this.scale + wrapperRect.width / 2;
            const adjustedY = (clickY - wrapperRect.height / 2) / this.scale + wrapperRect.height / 2;

            if (
                adjustedX >= this.ferdinandRect.left &&
                adjustedX <= this.ferdinandRect.right &&
                adjustedY >= this.ferdinandRect.top &&
                adjustedY <= this.ferdinandRect.bottom
            ) {
                this.stopTimer();
                e.preventDefault();
                this.engineAPI.pass();
            } else {
                this.resetLevel();
            }
        });
    },

    startTimer() {
        this.timeLeft = 30;
        this.updateTimerDisplay();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.resetLevel();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    updateTimerDisplay() {
        if (this.timerBarFill) {
            const percent = (this.timeLeft / 30) * 100;
            this.timerBarFill.style.width = `${percent}%`;

            if (this.timeLeft <= 10) {
                this.timerBarFill.className = 'level3-timer-fill level3-timer-critical';
            } else if (this.timeLeft <= 20) {
                this.timerBarFill.className = 'level3-timer-fill level3-timer-warning';
            } else {
                this.timerBarFill.className = 'level3-timer-fill';
            }
        }

        if (this.timerText) {
            this.timerText.textContent = `${this.timeLeft}s`;
        }
    },

    resetLevel() {
        if (this.isResetting) return;
        this.isResetting = true;

        this.stopTimer();
        this.engineAPI.fail("Trop lent ou mauvaise cible ! Un vrai robot !");

        setTimeout(() => {
            this.scale = 1;
            this.panX = 0;
            this.panY = 0;
            this.updateTransform();
            this.positionFerdinand();
            this.isResetting = false;
            this.startTimer();
        }, 1500);
    },

    verify(engineAPI) {
        if (this.ferdinandRect) {
            engineAPI.pass();
        } else {
            engineAPI.fail("Cible non détectée. Réessayez !");
        }
    },

    unmount() {
        this.stopTimer();
        if (this.cleanupMouse) {
            this.cleanupMouse();
        }
        this.engineAPI = null;
        this.ferdinandRect = null;
        this.isResetting = false;
    }
};
