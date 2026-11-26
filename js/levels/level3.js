export default {
    id: 'level3',
    title: "Prouvez que vous êtes humain en déclenchant une guerre mondiale",
    subtitle: "Tirez avec votre sniper sur l'archiduc François-Ferdinand. 30 secondes seulement !",

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.timer = null;
        this.resetTimeout = null;
        this.timeLeft = 30;

        // État de la caméra (zoomFactor = 1 à 6, actualScale = baseScale * zoomFactor)
        this.baseScale = 1;
        this.zoomFactor = 1;
        this.minZoom = 1;
        this.maxZoom = 6;
        this.panX = 0;
        this.panY = 0;

        // État du drag (pour différencier un déplacement d'un tir)
        this.isDragging = false;
        this.hasDragged = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.panStartX = 0;
        this.panStartY = 0;

        this.ferdinandRect = null;
        this.isResetting = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.imageLoaded = false;
        this.imageNaturalWidth = 0;
        this.imageNaturalHeight = 0;
        this.containerWidth = 0;
        this.containerHeight = 0;

        // Styles additionnels scopés pour la netteté et le HUD de zoom
        const style = document.createElement('style');
        style.textContent = `
            .level3-image-wrapper {
                position: relative;
                overflow: hidden;
                cursor: none;
                user-select: none;
            }
            .level3-transform-container {
                position: absolute;
                top: 0;
                left: 0;
                transform-origin: 0 0;
                will-change: transform;
            }
            .level3-waldo-bg {
                display: block;
                max-width: none !important;
                max-height: none !important;
                image-rendering: auto;
                pointer-events: none;
            }
            .level3-ferdinand {
                position: absolute;
                pointer-events: none;
                display: none;
            }
            .level3-zoom-hud {
                position: absolute;
                bottom: 8px;
                right: 8px;
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(0, 0, 0, 0.65);
                padding: 3px 6px;
                border-radius: 4px;
                z-index: 20;
                cursor: default;
            }
            .level3-zoom-btn {
                width: 22px;
                height: 22px;
                border: none;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.18);
                color: #fff;
                font-size: 14px;
                font-weight: 700;
                line-height: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .level3-zoom-btn:hover {
                background: rgba(255, 255, 255, 0.35);
            }
            .level3-zoom-label {
                color: #fff;
                font-size: 11px;
                font-weight: 600;
                min-width: 30px;
                text-align: center;
            }
            .level3-controls-hint {
                font-size: 11px;
                color: #666;
                text-align: center;
                margin-top: 4px;
            }
        `;
        container.appendChild(style);

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

        const helpSection = document.createElement('div');
        helpSection.className = 'level3-help-section';

        const helpText = document.createElement('span');
        helpText.className = 'level3-help-text';
        helpText.textContent = 'Il ressemble à ça :';

        const helpImg = document.createElement('img');
        helpImg.className = 'level3-help-img';
        helpImg.src = 'asset/ferdinand.png';
        helpImg.alt = 'Ferdinand';
        helpImg.draggable = false;

        helpSection.appendChild(helpText);
        helpSection.appendChild(helpImg);
        gameContainer.appendChild(helpSection);
        this.helpSection = helpSection;

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'level3-image-wrapper';
        this.imageWrapper = imageWrapper;

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

        // HUD de zoom (+ / -)
        const zoomHud = document.createElement('div');
        zoomHud.className = 'level3-zoom-hud';
        zoomHud.addEventListener('mousedown', (e) => e.stopPropagation());
        zoomHud.addEventListener('click', (e) => e.stopPropagation());

        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.type = 'button';
        zoomOutBtn.className = 'level3-zoom-btn';
        zoomOutBtn.textContent = '−';
        zoomOutBtn.addEventListener('click', () => this.zoomAtCenter(1 / 1.35));

        this.zoomLabel = document.createElement('span');
        this.zoomLabel.className = 'level3-zoom-label';
        this.zoomLabel.textContent = '1.0×';

        const zoomInBtn = document.createElement('button');
        zoomInBtn.type = 'button';
        zoomInBtn.className = 'level3-zoom-btn';
        zoomInBtn.textContent = '+';
        zoomInBtn.addEventListener('click', () => this.zoomAtCenter(1.35));

        zoomHud.appendChild(zoomOutBtn);
        zoomHud.appendChild(this.zoomLabel);
        zoomHud.appendChild(zoomInBtn);
        imageWrapper.appendChild(zoomHud);

        const controlsHint = document.createElement('div');
        controlsHint.className = 'level3-controls-hint';
        controlsHint.textContent = 'Molette : zoomer • Cliquer-glisser : déplacer • Clic : tirer';

        gameContainer.appendChild(imageWrapper);
        gameContainer.appendChild(controlsHint);
        container.appendChild(gameContainer);

        waldoImage.addEventListener('dragstart', (e) => e.preventDefault());
        ferdinandImg.addEventListener('dragstart', (e) => e.preventDefault());

        const initGame = () => {
            this.imageLoaded = true;
            this.imageNaturalWidth = waldoImage.naturalWidth;
            this.imageNaturalHeight = waldoImage.naturalHeight;
            this.updateContainerSize(imageWrapper);
            this.resetCamera();
            this.positionFerdinand();
        };

        if (waldoImage.complete && waldoImage.naturalWidth > 0) {
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

        this.setupControls(imageWrapper);
        this.startTimer();
    },

    getActualScale() {
        return this.baseScale * this.zoomFactor;
    },

    updateContainerSize(wrapper) {
        const rect = wrapper.getBoundingClientRect();
        this.containerWidth = rect.width;
        this.containerHeight = rect.height;

        if (!this.imageLoaded || !this.waldoImage) return;

        // Rendu à la taille native pour conserver 100% de la résolution lors du zoom
        this.waldoImage.style.width = `${this.imageNaturalWidth}px`;
        this.waldoImage.style.height = `${this.imageNaturalHeight}px`;
        this.transformContainer.style.width = `${this.imageNaturalWidth}px`;
        this.transformContainer.style.height = `${this.imageNaturalHeight}px`;

        // Échelle de base pour remplir entièrement le cadre sans bordure vide
        this.baseScale = Math.max(
            this.containerWidth / this.imageNaturalWidth,
            this.containerHeight / this.imageNaturalHeight
        );
    },

    resetCamera() {
        this.zoomFactor = 1;
        const actualScale = this.getActualScale();
        const scaledW = this.imageNaturalWidth * actualScale;
        const scaledH = this.imageNaturalHeight * actualScale;

        // Centre l'image au départ
        this.panX = (this.containerWidth - scaledW) / 2;
        this.panY = (this.containerHeight - scaledH) / 2;
        this.clampPan();
        this.updateTransform();
    },

    clampPan() {
        const actualScale = this.getActualScale();
        const scaledW = this.imageNaturalWidth * actualScale;
        const scaledH = this.imageNaturalHeight * actualScale;

        const minX = Math.min(0, this.containerWidth - scaledW);
        const minY = Math.min(0, this.containerHeight - scaledH);

        this.panX = Math.max(minX, Math.min(0, this.panX));
        this.panY = Math.max(minY, Math.min(0, this.panY));
    },

positionFerdinand() {
        if (!this.ferdinandImg || !this.imageLoaded) return;

        const ferdWidth = Math.round(Math.max(24, this.imageNaturalWidth * 0.035));
        const ferdHeight = Math.round(ferdWidth * 1.25);

        // Compute the currently visible area in native image coordinates
        const actualScale = this.getActualScale();
        const visibleLeft = -this.panX / actualScale;
        const visibleTop = -this.panY / actualScale;
        const visibleRight = (this.containerWidth - this.panX) / actualScale;
        const visibleBottom = (this.containerHeight - this.panY) / actualScale;

        // Keep a 16px screen margin (and 40px at the bottom to avoid the zoom HUD)
        const margin = 16 / actualScale;
        const bottomHudMargin = 40 / actualScale;

        const minX = visibleLeft + margin;
        const maxX = Math.max(minX, visibleRight - ferdWidth - margin);
        const minY = visibleTop + margin;
        const maxY = Math.max(minY, visibleBottom - ferdHeight - bottomHudMargin);

        const randomX = Math.round(minX + Math.random() * (maxX - minX));
        const randomY = Math.round(minY + Math.random() * (maxY - minY));

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

    zoomAtPoint(factor, pivotX, pivotY) {
        if (!this.imageLoaded) return;

        const oldActualScale = this.getActualScale();
        const nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomFactor * factor));
        if (nextZoom === this.zoomFactor) return;

        const imgX = (pivotX - this.panX) / oldActualScale;
        const imgY = (pivotY - this.panY) / oldActualScale;

        this.zoomFactor = nextZoom;
        const newActualScale = this.getActualScale();

        this.panX = pivotX - imgX * newActualScale;
        this.panY = pivotY - imgY * newActualScale;

        this.clampPan();
        this.updateTransform();
    },

    zoomAtCenter(factor) {
        this.zoomAtPoint(factor, this.containerWidth / 2, this.containerHeight / 2);
    },

    setupControls(wrapper) {
        const handleMouseMove = (e) => {
            const rect = wrapper.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.updateScopePosition();

            if (this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;
                if (Math.hypot(dx, dy) > 5) {
                    this.hasDragged = true;
                }
                this.panX = this.panStartX + dx;
                this.panY = this.panStartY + dy;
                this.clampPan();
                this.updateTransform();
            }
        };

        const handleMouseDown = (e) => {
            if (e.button !== 0 || this.isResetting) return;
            e.preventDefault();
            this.isDragging = true;
            this.hasDragged = false;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.panStartX = this.panX;
            this.panStartY = this.panY;
        };

        const handleMouseUp = () => {
            this.isDragging = false;
        };

        const handleWheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
            this.zoomAtPoint(factor, this.mouseX, this.mouseY);
        };

        const handleKeyDown = (e) => {
            if (e.key === '+' || e.key === '=') {
                this.zoomAtCenter(1.25);
            } else if (e.key === '-') {
                this.zoomAtCenter(1 / 1.25);
            }
        };

        const handleClick = (e) => {
            if (this.isResetting || !this.ferdinandRect || this.hasDragged) return;

            const rect = wrapper.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const actualScale = this.getActualScale();

            const imgX = (clickX - this.panX) / actualScale;
            const imgY = (clickY - this.panY) / actualScale;

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
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);
        wrapper.addEventListener('mousedown', handleMouseDown);
        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        wrapper.addEventListener('click', handleClick);

        this.cleanupControls = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleKeyDown);
            wrapper.removeEventListener('mousedown', handleMouseDown);
            wrapper.removeEventListener('wheel', handleWheel);
            wrapper.removeEventListener('click', handleClick);
        };
    },

    updateScopePosition() {
        if (!this.scopeCursor) return;
        this.scopeCursor.style.left = `${this.mouseX}px`;
        this.scopeCursor.style.top = `${this.mouseY}px`;
    },

    updateTransform() {
        if (!this.transformContainer) return;

        const actualScale = this.getActualScale();
        this.transformContainer.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${actualScale})`;

        if (this.zoomLabel) {
            this.zoomLabel.textContent = `${this.zoomFactor.toFixed(1)}×`;
        }
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

        this.resetTimeout = setTimeout(() => {
            if (!this.engineAPI) return;
            this.resetCamera();
            this.positionFerdinand();
            this.isResetting = false;
            this.startTimer();
        }, 1500);
    },

    verify(engineAPI) {
        engineAPI.fail("Tirez directement sur l'archiduc François-Ferdinand dans l'image !");
    },

    unmount() {
        this.stopTimer();
        clearTimeout(this.resetTimeout);
        if (this.cleanupControls) {
            this.cleanupControls();
            this.cleanupControls = null;
        }
        this.engineAPI = null;
        this.ferdinandRect = null;
        this.isResetting = false;
    }
};