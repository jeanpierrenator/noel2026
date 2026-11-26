export default {
    id: 'level1',
    title: 'Cliquez sur tous les appareils Mirion',
    subtitle: 'S\'il n\'y en a plus, vous pourrez passer à la suite.',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.timeouts = [];
        this.isCompleted = false;

        this.mirionImages = [
            'asset/spir.jpg',
            'asset/xom.jpg',
            'asset/accurad-prd-2.avif',
            'asset/dmc-3000_001.avif'
        ];

        this.hydrantImages = [
            'asset/bouche.jpg',
            'asset/bouche2.jpg',
            'asset/bouche3.jpg',
            'asset/bouche4.jpg'
        ];

        this.sisyphusImage = 'asset/sisyphe.webp';

        const style = document.createElement('style');
        style.textContent = `
            .level1-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                user-select: none;
            }
            .level1-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
                width: 100%;
                max-width: 312px;
                background: #fff;
            }
            .level1-cell {
                position: relative;
                aspect-ratio: 1 / 1;
                overflow: hidden;
                border-radius: 3px;
                background: #f1f3f4;
                cursor: pointer;
                border: 2px solid transparent;
                box-sizing: border-box;
                transition: border-color 0.15s;
            }
            .level1-cell:hover {
                border-color: #1a73e8;
            }
            .level1-cell-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                pointer-events: none;
                opacity: 1;
                transform: scale(1);
                transition: opacity 0.35s ease, transform 0.35s ease;
            }
            .level1-cell.level1-fading .level1-cell-img {
                opacity: 0;
                transform: scale(0.9);
            }
            .level1-hint {
                font-size: 11px;
                color: #666;
                text-align: center;
            }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'level1-wrapper';

        const grid = document.createElement('div');
        grid.className = 'level1-grid';

        // Choisir 4 emplacements aléatoires pour les appareils Mirion
        const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const mirionSlots = new Set(indices.slice(0, 4));

        this.stage = 4; // Nombre d'appareils Mirion actifs (4 -> 3 -> 2 -> 1 -> 0)
        this.cells = [];
        let mirionIdx = 0;
        let hydrantIdx = 0;

        for (let i = 0; i < 9; i++) {
            const isMirion = mirionSlots.has(i);
            const src = isMirion
                ? this.mirionImages[mirionIdx++ % this.mirionImages.length]
                : this.hydrantImages[hydrantIdx++ % this.hydrantImages.length];

            const cellEl = document.createElement('div');
            cellEl.className = 'level1-cell';

            const imgEl = document.createElement('img');
            imgEl.className = 'level1-cell-img';
            imgEl.src = src;
            imgEl.alt = isMirion ? 'Appareil Mirion' : 'Bouche à incendie';
            imgEl.draggable = false;

            cellEl.appendChild(imgEl);
            grid.appendChild(cellEl);

            const cellData = {
                index: i,
                type: isMirion ? 'mirion' : 'hydrant',
                src,
                clicksInStage: 0,
                isTransitioning: false,
                el: cellEl,
                img: imgEl
            };

            cellEl.addEventListener('click', () => this.handleCellClick(cellData));
            this.cells.push(cellData);
        }

        const hint = document.createElement('div');
        hint.className = 'level1-hint';
        hint.textContent = 'De nouvelles images apparaissent après chaque clic.';

        wrapper.appendChild(grid);
        wrapper.appendChild(hint);
        container.appendChild(wrapper);

        engineAPI.setVerifyButtonEnabled(false);
    },

    getRandomOtherMirionImage(currentSrc) {
        const candidates = this.mirionImages.filter(src => src !== currentSrc);
        return candidates[Math.floor(Math.random() * candidates.length)];
    },

    handleCellClick(cell) {
        if (this.isCompleted || cell.isTransitioning) return;

        if (cell.type === 'hydrant') {
            this.engineAPI?.fail('C\'est une bouche à incendie, pas un appareil Mirion !');
            return;
        }

        if (cell.type === 'sisyphus') {
            this.engineAPI?.fail('C\'est Sisyphe... courage, cliquez sur les appareils Mirion restants !');
            return;
        }

        // Clic sur un appareil Mirion
        cell.isTransitioning = true;
        cell.clicksInStage += 1;

        const activeMirionCells = this.cells.filter(c => c.type === 'mirion');
        const stageComplete = activeMirionCells.every(c => c.clicksInStage >= this.stage);

        // Effet fondu sortant
        cell.el.classList.add('level1-fading');

        const t = setTimeout(() => {
            if (!this.engineAPI) return;

            if (stageComplete) {
                // Cet emplacement devient Sisyphe et on passe au palier suivant
                cell.type = 'sisyphus';
                cell.src = this.sisyphusImage;
                cell.img.src = this.sisyphusImage;
                cell.img.alt = 'Sisyphe';

                this.stage -= 1;
                for (const c of this.cells) {
                    if (c.type === 'mirion') {
                        c.clicksInStage = 0;
                    }
                }
            } else {
                // Remplacement par un autre appareil Mirion
                const nextSrc = this.getRandomOtherMirionImage(cell.src);
                cell.src = nextSrc;
                cell.img.src = nextSrc;
            }

            // Effet fondu entrant
            cell.el.classList.remove('level1-fading');
            cell.isTransitioning = false;

            // Vérifier s'il reste des appareils Mirion
            if (this.stage <= 0) {
                this.isCompleted = true;
                this.engineAPI.setVerifyButtonEnabled(true);
                const passTimer = setTimeout(() => {
                    this.engineAPI?.pass();
                }, 600);
                this.timeouts.push(passTimer);
            }
        }, 360);

        this.timeouts.push(t);
    },

    verify(engineAPI) {
        if (this.isCompleted) {
            engineAPI.pass();
        } else {
            engineAPI.fail('Il reste encore des appareils Mirion à cliquer !');
        }
    },

    unmount() {
        for (const t of this.timeouts) {
            clearTimeout(t);
        }
        this.timeouts = [];
        this.cells = [];
        this.engineAPI = null;
    }
};