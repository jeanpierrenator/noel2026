export default {
    id: 'level1',
    title: 'Sélectionnez tous les carrés contenant un lutin fatigué',
    subtitle: 'Le lutin fatigué a trop travaillé pour Noêl et dort partout.',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.selectedCells = new Set();
        this.correctCells = new Set();

        const gridEmojis = ['🧝', '🧝', '🧝', '🧝', '🧝', '🧝', '🧝', '🧝', '🧝'];
        const correctIndices = [];

        while (correctIndices.length < 3) {
            const idx = Math.floor(Math.random() * 9);
            if (!correctIndices.includes(idx)) {
                correctIndices.push(idx);
            }
        }

        for (const idx of correctIndices) {
            gridEmojis[idx] = '😴';
            this.correctCells.add(idx);
        }

        const grid = document.createElement('div');
        grid.className = 'captcha-grid';

        gridEmojis.forEach((emoji, index) => {
            const cell = document.createElement('div');
            cell.className = 'captcha-grid-item';
            cell.textContent = emoji;
            cell.addEventListener('click', () => this.handleCellClick(index, cell));
            grid.appendChild(cell);
        });

        container.appendChild(grid);
    },

    handleCellClick(index, cell) {
        if (this.selectedCells.has(index)) {
            this.selectedCells.delete(index);
            cell.classList.remove('selected');
        } else {
            this.selectedCells.add(index);
            cell.classList.add('selected');
        }

        const allSelected = this.selectedCells.size >= 3;
        const allCorrect = Array.from(this.selectedCells).every(idx => this.correctCells.has(idx));
        const isExact = this.selectedCells.size === this.correctCells.size && allCorrect;

        if (isExact) {
            this.engineAPI.pass();
        } else if (allSelected && !isExact) {
            const wrongCount = Array.from(this.selectedCells).filter(idx => !this.correctCells.has(idx)).length;
            this.engineAPI.fail(`Vous avez sélectionné ${wrongCount} carré${wrongCount > 1 ? 's' : ''} inutile${wrongCount > 1 ? 's' : ''}. Le lutin fatigué, c'est celui qui dort, pas celui qui travaille !`);
        }
    },

    verify(engineAPI) {
        const isExact = Array.from(this.selectedCells).every(idx => this.correctCells.has(idx)) &&
                        this.selectedCells.size === this.correctCells.size;
        if (isExact) {
            engineAPI.pass();
        } else {
            engineAPI.fail('Sélection incorrecte. Cherchez le lutin qui dort, pas celui qui travaille !');
        }
    },

    unmount() {
        this.selectedCells.clear();
        this.correctCells.clear();
        this.engineAPI = null;
    }
};
