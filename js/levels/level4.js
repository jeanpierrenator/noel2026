export default {
    id: 'level4',
    title: 'Cochez toutes les cases qui contiennent le 42ème étage de la tour Montparnasse',
    subtitle: 'Bonne chance!',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.gridSize = 30;
        this.isDragging = false;
        this.dragMode = null; // 'select' ou 'deselect'

        // Position du 42ème étage dans la grille 30x30 (ligne 9, colonnes 11 à 17)
        // Facile à ajuster si besoin
        this.targetRow = 7;
        this.targetCols = [11, 12, 13, 14, 15, 16, 17];
        this.correctCells = new Set(
            this.targetCols.map(col => this.targetRow * this.gridSize + col)
        );
        this.selectedCells = new Set();

        const style = document.createElement('style');
        style.textContent = `
            .level4-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                user-select: none;
            }
            .level4-board {
                position: relative;
                width: 100%;
                max-width: 330px;
                aspect-ratio: 1 / 1;
                border-radius: 4px;
                overflow: hidden;
                background: #e0e0e0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            }
            .level4-bg-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
                display: block;
                pointer-events: none;
            }
            .level4-grid {
                position: absolute;
                inset: 0;
                display: grid;
                grid-template-columns: repeat(30, 1fr);
                grid-template-rows: repeat(30, 1fr);
            }
            .level4-cell {
                border: 0.5px solid rgba(255, 255, 255, 0.28);
                cursor: crosshair;
                box-sizing: border-box;
                transition: background-color 0.06s;
            }
            .level4-cell:hover {
                background-color: rgba(26, 115, 232, 0.35);
            }
            .level4-cell.level4-selected {
                background-color: rgba(26, 115, 232, 0.72);
                border-color: rgba(255, 255, 255, 0.9);
            }
            .level4-hint {
                font-size: 11px;
                color: #666;
                text-align: center;
            }
            .level4-error-img {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                text-align: center;
                font-size: 13px;
                color: #d93025;
                background: #fce8e6;
            }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'level4-wrapper';

        const board = document.createElement('div');
        board.className = 'level4-board';

        const img = document.createElement('img');
        img.className = 'level4-bg-img';
        img.src = 'asset/montparnass.jpg';
        img.alt = 'Tour Montparnasse';
        img.draggable = false;

        img.onerror = () => {
            const err = document.createElement('div');
            err.className = 'level4-error-img';
            err.textContent = 'Image introuvable : vérifiez que asset/montparnass.jpg existe bien.';
            board.appendChild(err);
        };

        const grid = document.createElement('div');
        grid.className = 'level4-grid';

        const totalCells = this.gridSize * this.gridSize;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'level4-cell';
            cell.dataset.index = i;

            cell.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isDragging = true;
                this.dragMode = this.selectedCells.has(i) ? 'deselect' : 'select';
                this.setCellState(i, cell, this.dragMode === 'select');
            });

            cell.addEventListener('mouseenter', () => {
                if (!this.isDragging) return;
                this.setCellState(i, cell, this.dragMode === 'select');
            });

            grid.appendChild(cell);
        }

        const handleMouseUp = () => {
            this.isDragging = false;
            this.dragMode = null;
        };
        document.addEventListener('mouseup', handleMouseUp);

        this.cleanup = () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };

        const hint = document.createElement('div');
        hint.className = 'level4-hint';
        hint.textContent = 'Cliquez ou glissez pour sélectionner les cases, puis cliquez sur VÉRIFIER.';

        board.appendChild(img);
        board.appendChild(grid);
        wrapper.appendChild(board);
        wrapper.appendChild(hint);
        container.appendChild(wrapper);

        engineAPI.setVerifyButtonEnabled(false);
    },

    setCellState(index, cellEl, selected) {
        if (selected) {
            this.selectedCells.add(index);
            cellEl.classList.add('level4-selected');
        } else {
            this.selectedCells.delete(index);
            cellEl.classList.remove('level4-selected');
        }
        this.engineAPI?.setVerifyButtonEnabled(this.selectedCells.size > 0);
    },

    verify(engineAPI) {
        if (this.selectedCells.size === 0) {
            engineAPI.fail('Sélectionnez au moins une case !');
            return;
        }

        const isExact =
            this.selectedCells.size === this.correctCells.size &&
            Array.from(this.selectedCells).every(idx => this.correctCells.has(idx));

        if (isExact) {
            engineAPI.pass();
            return;
        }

        const selected = Array.from(this.selectedCells);
        const minCol = Math.min(...this.targetCols);
        const maxCol = Math.max(...this.targetCols);

        const hasOffTower = selected.some(idx => {
            const col = idx % this.gridSize;
            return col < minCol || col > maxCol;
        });
        const hasTooHigh = selected.some(idx => Math.floor(idx / this.gridSize) < this.targetRow);
        const hasTooLow = selected.some(idx => Math.floor(idx / this.gridSize) > this.targetRow);
        const allValidButIncomplete = selected.every(idx => this.correctCells.has(idx));

        if (allValidButIncomplete) {
            engineAPI.fail('Presque ! il manque des case');
        } else if (hasOffTower) {
            engineAPI.fail('Vous débordez de la tour ! ');
        } else if (hasTooHigh) {
            engineAPI.fail('Trop haut ! ');
        } else if (hasTooLow) {
            engineAPI.fail('Trop bas ! ');
        } else {
            engineAPI.fail('Mauvaise sélection. Réessayez !');
        }
    },

    unmount() {
        if (this.cleanup) {
            this.cleanup();
            this.cleanup = null;
        }
        this.selectedCells?.clear();
        this.correctCells?.clear();
        this.engineAPI = null;
    }
};