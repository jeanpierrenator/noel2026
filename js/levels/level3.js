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
        this.imageLoaded = false;
        this.imageNaturalWidth = 0;
        this.imageNaturalHeight = 0;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.edgeZone = 60;
        this.panSpeed = 8;

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

        const transformContainer = document.createElement('div');
        transformContainer.className = 'level3-transform-container';
        this.transformContainer = transformContainer;

        const waldoImage = document.createElement('img');
        waldoImage.className = 'level3-waldo-bg';
        waldoImage.src = 'asset/where_is_waldo.jpg';
        waldoImage.alt = 'Où est Charlie ?';
        waldoImage.draggable = false;
        this.waldoImage = waldoImage;

        const ferdinandImg = document.createElement('img');
        ferdinandImg.className = 'level3-ferdinand';
        ferdinandImg.src = 'asset/ferdinand.png';
        ferdinandImg.draggable = false;
        this.ferdinandImg = ferdinandImg;

        transformContainer.appendChild(waldoImage);
        transformContainer.appendChild(ferdinandImg);
        imageWrapper.appendChild(transformContainer);

        const scopeCursor = document.createElement('div');
        scopeCursor.className = 'level3-scope-cursor';
        this.scopeCursor = scopeCursor;
        imageWrapper.appendChild(scopeCursor);

        gameContainer.appendChild(imageWrapper);
        container.appendChild(gameContainer);

        waldoImage.addEventListener('dragstart', (e) => e.preventDefault());
        ferdinandImg.addEventListener('dragstart', (e) => e.preventDefault());

        const initGame = () => {
            this.imageLoaded = true;
            this.imageNaturalWidth = waldoImage.naturalWidth;
            this.imageNaturalHeight = waldoImage.naturalHeight;
            this.updateContainerSize(imageWrapper);
            this.positionFerdinand();
        };

        if (waldoImage.complete && waldoImage.src) {
            initGame();
        } else {
            waldoImage.addEventListener('load', initGame);
        }

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
        this.setupEdgePan(imageWrapper);
        this.startTimer();
    },

    updateContainerSize(wrapper) {
        const rect = wrapper.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;

        if (!this.imageLoaded || !this.waldoImage) return;

        const imgAspect = this.imageNaturalWidth / this.imageNaturalHeight;
        const wrapperAspect = this.containerWidth / this.containerHeight;

        let displayWidth, displayHeight;

        if (imgAspect > wrapperAspect) {
            displayHeight = this.containerHeight;
            displayWidth = this.containerHeight * imgAspect;
        } else {
            displayWidth = this.containerWidth;
            displayHeight = this.containerWidth / imgAspect;
        }

        this.waldoImage.style.width = `${displayWidth}px`;
        this.waldoImage.style.height = `${displayHeight}px`;

        if (this.ferdinandImg) {
            this.ferdinandImg.style.width = '';
            this.ferdinandImg.style.height = '';
        }
    },

    positionFerdinand() {
        if (!this.ferdinandImg || !this.imageLoaded) return;

        const transformContainer = this.transformContainer;
        if (!transformContainer) return;

        const containerRect = transformContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        const ferdWidth = 20;
        const ferdHeight = 25;

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
            x: randomX,
            y: randomY,
            width: ferdWidth,
            height: ferdHeight
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
            const delta = -e.deltaY * 0.005;
            const oldScale = this.scale;
            let newScale = oldScale + delta;
            newScale = Math.max(1, Math.min(5, newScale));

            if (newScale === oldScale) return;

            const mx = this.mouseX;
            const my = this.mouseY;

            const imgX = (mx - this.panX) / oldScale;
            const imgY = (my - this.panY) / oldScale;

            this.scale = newScale;
            this.panX = mx - imgX * newScale;
            this.panY = my - imgY * newScale;

            this.updateTransform();
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            const oldScale = this.scale;
            const cx = this.containerWidth / 2;
            const cy = this.containerHeight / 2;

            if (e.key === '+' || e.key === '=') {
                this.scale = Math.min(5, oldScale + 0.3);
            } else if (e.key === '-') {
                this.scale = Math.max(1, oldScale - 0.3);
            } else {
                return;
            }

            const imgX = (cx - this.panX) / oldScale;
            const imgY = (cy - this.panY) / oldScale;
            this.panX = cx - imgX * this.scale;
            this.panY = cy - imgY * this.scale;

            this.updateTransform();
        });
    },

    setupEdgePan(wrapper) {
        const handleTick = () => {
            if (!this.transformContainer || this.containerWidth === 0) {
                requestAnimationFrame(handleTick);
                return;
            }

            const containerWidth = this.containerWidth;
            const containerHeight = this.containerHeight;

            let dx = 0;
            let dy = 0;

            if (this.scale > 1.2) {
                if (this.mouseX < this.edgeZone) {
                    dx = this.panSpeed * (1 - this.mouseX / this.edgeZone);
                } else if (this.mouseX > containerWidth - this.edgeZone) {
                    dx = -this.panSpeed * (1 - (containerWidth - this.mouseX) / this.edgeZone);
                }

                if (this.mouseY < this.edgeZone) {
                    dy = this.panSpeed * (1 - this.mouseY / this.edgeZone);
                } else if (this.mouseY > containerHeight - this.edgeZone) {
                    dy = -this.panSpeed * (1 - (containerHeight - this.mouseY) / this.edgeZone);
                }
            }

            if (dx !== 0 || dy !== 0) {
                this.panX += dx;
                this.panY += dy;
                this.updateTransform();
            }

            requestAnimationFrame(handleTick);
        };

        requestAnimationFrame(handleTick);
    },

    updateTransform() {
        if (!this.transformContainer) return;

        this.transformContainer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    },

    setupClick(wrapper, waldoImg, ferdinandImg) {
        wrapper.addEventListener('click', (e) => {
            if (this.isResetting || !this.ferdinandRect) return;

            const wrapperRect = wrapper.getBoundingClientRect();
            const clickX = e.clientX - wrapperRect.left;
            const clickY = e.clientY - wrapperRect.top;

            const imgX = (clickX - this.panX) / this.scale;
            const imgY = (clickY - this.panY) / this.scale;

            const ferd = this.ferdinandRect;
            if (
                imgX >= ferd.x &&
                imgX <= ferd.x + ferd.width &&
                imgY >= ferd.y &&
                imgY <= ferd.y + ferd.height
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
