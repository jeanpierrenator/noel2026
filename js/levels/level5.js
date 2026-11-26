export default {
    id: 'level5',
    title: 'Montrez que vous êtes humain en perdant aux échecs contre l\'ordinateur',
    subtitle: 'Seule une IA gagne aux échecs. Faites-vous mater par notre robot pour prouver votre humanité.',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.aiTimeout = null;
        this.passTimeout = null;
        this.resetTimeout = null;
        this.playerLost = false;
        this.isThinking = false;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.lastMove = null;
        this.pendingPromotion = null;

        // Styles scopés au niveau 5 (nettoyés automatiquement avec container)
        const style = document.createElement('style');
        style.textContent = `
            .level5-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                user-select: none;
            }
            .level5-status-bar {
                width: 100%;
                max-width: 312px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
                font-weight: 600;
                color: #333;
                background: #f4f6f8;
                padding: 6px 10px;
                border-radius: 6px;
                box-sizing: border-box;
            }
            .level5-status-text.level5-check {
                color: #d93025;
            }
            .level5-status-text.level5-win {
                color: #2e7d32;
            }
            .level5-reset-btn {
                background: #fff;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 3px 8px;
                font-size: 11px;
                cursor: pointer;
                color: #444;
                transition: background 0.15s;
            }
            .level5-reset-btn:hover {
                background: #e9ecef;
            }
            .level5-board-container {
                position: relative;
                width: 100%;
                max-width: 312px;
                aspect-ratio: 1 / 1;
                border: 2px solid #2c3e50;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            .level5-board {
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                grid-template-rows: repeat(8, 1fr);
                width: 100%;
                height: 100%;
            }
            .level5-square {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                line-height: 1;
                cursor: pointer;
                transition: background-color 0.1s;
            }
            .level5-light {
                background-color: #f0d9b5;
            }
            .level5-dark {
                background-color: #b58863;
            }
            .level5-last-move.level5-light {
                background-color: #cdd26a;
            }
            .level5-last-move.level5-dark {
                background-color: #aaa23a;
            }
            .level5-selected {
                background-color: #7fc97f !important;
            }
            .level5-in-check {
                background: radial-gradient(circle, #ff4d4d 0%, #c0392b 85%) !important;
            }
            .level5-piece-w {
                color: #ffffff;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85), 0 0 1px #000;
            }
            .level5-piece-b {
                color: #1a1a1a;
                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.35);
            }
            .level5-hint-move::after {
                content: '';
                position: absolute;
                width: 28%;
                height: 28%;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.25);
                pointer-events: none;
            }
            .level5-hint-capture::after {
                content: '';
                position: absolute;
                inset: 4px;
                border-radius: 50%;
                border: 3px solid rgba(0, 0, 0, 0.3);
                pointer-events: none;
            }
            .level5-promo-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.65);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                z-index: 10;
            }
            .level5-promo-title {
                color: #fff;
                font-size: 13px;
                font-weight: 600;
            }
            .level5-promo-choices {
                display: flex;
                gap: 8px;
            }
            .level5-promo-btn {
                width: 44px;
                height: 44px;
                font-size: 28px;
                background: #f0d9b5;
                border: 2px solid #2c3e50;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .level5-promo-btn:hover {
                background: #fff;
                transform: scale(1.08);
            }
            .level5-tip {
                font-size: 11px;
                color: #666;
                text-align: center;
            }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'level5-wrapper';

        // Barre de statut + bouton recommencer
        const statusBar = document.createElement('div');
        statusBar.className = 'level5-status-bar';

        this.statusText = document.createElement('span');
        this.statusText.className = 'level5-status-text';
        this.statusText.textContent = 'À vous (Blancs)';

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'level5-reset-btn';
        resetBtn.textContent = '↻ Recommencer';
        resetBtn.addEventListener('click', () => this.resetGame());

        statusBar.appendChild(this.statusText);
        statusBar.appendChild(resetBtn);

        // Conteneur de l'échiquier
        const boardContainer = document.createElement('div');
        boardContainer.className = 'level5-board-container';
        this.boardContainer = boardContainer;

        this.boardEl = document.createElement('div');
        this.boardEl.className = 'level5-board';
        boardContainer.appendChild(this.boardEl);

        const tip = document.createElement('div');
        tip.className = 'level5-tip';
        tip.textContent = '';

        wrapper.appendChild(statusBar);
        wrapper.appendChild(boardContainer);
        wrapper.appendChild(tip);
        container.appendChild(wrapper);

        this.resetGame();
    },

    verify(engineAPI) {
        if (this.playerLost) {
            engineAPI.pass();
        } else {
            engineAPI.fail('Vous n\'avez pas encore perdu ! Faites-vous mater par l\'ordinateur.');
        }
    },

    unmount() {
        clearTimeout(this.aiTimeout);
        clearTimeout(this.passTimeout);
        clearTimeout(this.resetTimeout);
        this.engineAPI = null;
        this.boardEl = null;
        this.boardContainer = null;
        this.statusText = null;
    },

    // =========================================================
    // GESTION DE LA PARTIE & INTERFACE
    // =========================================================

    resetGame() {
        clearTimeout(this.aiTimeout);
        clearTimeout(this.passTimeout);
        clearTimeout(this.resetTimeout);

        this.state = this.createInitialState();
        this.playerLost = false;
        this.isThinking = false;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.lastMove = null;
        this.pendingPromotion = null;
        this.removePromotionOverlay();
        this.engineAPI?.setVerifyButtonEnabled(false);

        this.setStatus('À vous de jouer (Blancs)');
        this.renderBoard();
    },

    setStatus(text, extraClass = '') {
        if (!this.statusText) return;
        this.statusText.textContent = text;
        this.statusText.className = `level5-status-text ${extraClass}`.trim();
    },

    getPieceSymbol(piece) {
        const symbols = {
            w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
            b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
        };
        return symbols[piece.color][piece.type];
    },

    renderBoard() {
        if (!this.boardEl) return;
        this.boardEl.innerHTML = '';

        const whiteInCheck = this.isKingInCheck(this.state.board, 'w');
        const blackInCheck = this.isKingInCheck(this.state.board, 'b');

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                sq.className = `level5-square ${isLight ? 'level5-light' : 'level5-dark'}`;

                if (
                    this.lastMove &&
                    ((this.lastMove.from.r === r && this.lastMove.from.c === c) ||
                     (this.lastMove.to.r === r && this.lastMove.to.c === c))
                ) {
                    sq.classList.add('level5-last-move');
                }

                if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
                    sq.classList.add('level5-selected');
                }

                const piece = this.state.board[r][c];
                if (piece) {
                    const span = document.createElement('span');
                    span.className = piece.color === 'w' ? 'level5-piece-w' : 'level5-piece-b';
                    span.textContent = this.getPieceSymbol(piece);
                    sq.appendChild(span);

                    if (piece.type === 'k' && ((piece.color === 'w' && whiteInCheck) || (piece.color === 'b' && blackInCheck))) {
                        sq.classList.add('level5-in-check');
                    }
                }

                const targetMove = this.legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
                if (targetMove) {
                    const isCapture = Boolean(piece) || targetMove.enPassant;
                    sq.classList.add(isCapture ? 'level5-hint-capture' : 'level5-hint-move');
                }

                sq.addEventListener('click', () => this.handleSquareClick(r, c));
                this.boardEl.appendChild(sq);
            }
        }
    },

    handleSquareClick(r, c) {
        if (this.isThinking || this.playerLost || this.pendingPromotion || this.state.turn !== 'w') {
            return;
        }

        // Vérifier si le clic correspond à une destination légale de la pièce sélectionnée
        const matchingMoves = this.legalMovesForSelected.filter(m => m.to.r === r && m.to.c === c);
        if (matchingMoves.length > 0) {
            if (matchingMoves.length > 1 && matchingMoves[0].promotion) {
                this.showPromotionOverlay(matchingMoves);
                return;
            }
            this.executePlayerMove(matchingMoves[0]);
            return;
        }

        // Sinon, sélectionner une pièce blanche
        const piece = this.state.board[r][c];
        if (piece && piece.color === 'w') {
            this.selectedSquare = { r, c };
            const allWhiteMoves = this.getLegalMoves(this.state, 'w');
            this.legalMovesForSelected = allWhiteMoves.filter(m => m.from.r === r && m.from.c === c);
        } else {
            this.selectedSquare = null;
            this.legalMovesForSelected = [];
        }

        this.renderBoard();
    },

    showPromotionOverlay(promoMoves) {
        this.pendingPromotion = promoMoves;
        this.removePromotionOverlay();

        const overlay = document.createElement('div');
        overlay.className = 'level5-promo-overlay';

        const title = document.createElement('div');
        title.className = 'level5-promo-title';
        title.textContent = 'Choisissez votre promotion :';

        const choices = document.createElement('div');
        choices.className = 'level5-promo-choices';

        const order = ['q', 'r', 'b', 'n'];
        for (const type of order) {
            const move = promoMoves.find(m => m.promotion === type);
            if (!move) continue;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'level5-promo-btn level5-piece-w';
            btn.textContent = this.getPieceSymbol({ color: 'w', type });
            btn.addEventListener('click', () => {
                this.removePromotionOverlay();
                this.pendingPromotion = null;
                this.executePlayerMove(move);
            });
            choices.appendChild(btn);
        }

        overlay.appendChild(title);
        overlay.appendChild(choices);
        this.boardContainer.appendChild(overlay);
    },

    removePromotionOverlay() {
        const existing = this.boardContainer?.querySelector('.level5-promo-overlay');
        if (existing) existing.remove();
    },

    executePlayerMove(move) {
        this.state = this.applyMove(this.state, move);
        this.lastMove = move;
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.renderBoard();

        if (this.checkGameOver()) return;

        // Tour de l'IA
        this.isThinking = true;
        this.setStatus('L\'ordinateur réfléchit...');

        this.aiTimeout = setTimeout(() => {
            const aiMove = this.findBestMove(this.state, 3);
            if (aiMove) {
                this.state = this.applyMove(this.state, aiMove);
                this.lastMove = aiMove;
            }
            this.isThinking = false;
            this.renderBoard();

            if (!this.checkGameOver()) {
                if (this.isKingInCheck(this.state.board, 'w')) {
                    this.setStatus('Échec ! Continuez comme ça...', 'level5-check');
                } else {
                    this.setStatus('À vous de jouer (Blancs)');
                }
            }
        }, 260);
    },

    checkGameOver() {
        const currentTurn = this.state.turn;
        const legalMoves = this.getLegalMoves(this.state, currentTurn);
        const inCheck = this.isKingInCheck(this.state.board, currentTurn);

        if (legalMoves.length === 0) {
            if (inCheck) {
                if (currentTurn === 'w') {
                    // Les Blancs (le joueur) sont échec et mat -> SUCCÈS DU CAPTCHA !
                    this.playerLost = true;
                    this.setStatus('Échec et mat ! Défaite 100% humaine !', 'level5-win');
                    this.engineAPI?.setVerifyButtonEnabled(true);
                    this.passTimeout = setTimeout(() => {
                        this.engineAPI?.pass();
                    }, 1200);
                } else {
                    // Le joueur a battu l'ordinateur -> ÉCHEC DU CAPTCHA !
                    this.setStatus('Vous avez gagné ?! Alerte robot !', 'level5-check');
                    this.engineAPI?.fail('Vous avez battu l\'ordinateur ! Seule une IA fait ça. Vous devez PERDRE !');
                    this.resetTimeout = setTimeout(() => this.resetGame(), 2000);
                }
            } else {
                // Pat (match nul)
                this.setStatus('Pat ! Match nul...', 'level5-check');
                this.engineAPI?.fail('Match nul par pat ! Un vrai humain perd franchement. On recommence.');
                this.resetTimeout = setTimeout(() => this.resetGame(), 2000);
            }
            return true;
        }

        if (this.isInsufficientMaterial(this.state.board)) {
            this.setStatus('Matériel insuffisant...', 'level5-check');
            this.engineAPI?.fail('Plus assez de pièces pour vous faire mater ! Nouvelle partie.');
            this.resetTimeout = setTimeout(() => this.resetGame(), 2000);
            return true;
        }

        return false;
    },

    // =========================================================
    // MOTEUR D'ÉCHECS COMPLET (VANILLA JS)
    // =========================================================

    createInitialState() {
        const backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));

        for (let c = 0; c < 8; c++) {
            board[0][c] = { color: 'b', type: backRank[c] };
            board[1][c] = { color: 'b', type: 'p' };
            board[6][c] = { color: 'w', type: 'p' };
            board[7][c] = { color: 'w', type: backRank[c] };
        }

        return {
            board,
            turn: 'w',
            castling: { wK: true, wQ: true, bK: true, bQ: true },
            enPassant: null
        };
    },

    cloneBoard(board) {
        return board.map(row => row.map(cell => (cell ? { color: cell.color, type: cell.type } : null)));
    },

    inBounds(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    },

    findKing(board, color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color && p.type === 'k') {
                    return { r, c };
                }
            }
        }
        return null;
    },

    isSquareAttacked(board, r, c, byColor) {
        // Pions
        const pawnRow = byColor === 'w' ? r + 1 : r - 1;
        if (this.inBounds(pawnRow, c - 1)) {
            const p = board[pawnRow][c - 1];
            if (p && p.color === byColor && p.type === 'p') return true;
        }
        if (this.inBounds(pawnRow, c + 1)) {
            const p = board[pawnRow][c + 1];
            if (p && p.color === byColor && p.type === 'p') return true;
        }

        // Cavaliers
        const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of knightOffsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const p = board[nr][nc];
                if (p && p.color === byColor && p.type === 'n') return true;
            }
        }

        // Roi
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (this.inBounds(nr, nc)) {
                    const p = board[nr][nc];
                    if (p && p.color === byColor && p.type === 'k') return true;
                }
            }
        }

        // Lignes droites (Tour / Dame)
        const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of orthoDirs) {
            let nr = r + dr;
            let nc = c + dc;
            while (this.inBounds(nr, nc)) {
                const p = board[nr][nc];
                if (p) {
                    if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }

        // Diagonales (Fou / Dame)
        const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagDirs) {
            let nr = r + dr;
            let nc = c + dc;
            while (this.inBounds(nr, nc)) {
                const p = board[nr][nc];
                if (p) {
                    if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }

        return false;
    },

    isKingInCheck(board, color) {
        const king = this.findKing(board, color);
        if (!king) return true;
        const enemy = color === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(board, king.r, king.c, enemy);
    },

    applyMove(state, move) {
        const board = this.cloneBoard(state.board);
        const castling = { ...state.castling };
        const piece = board[move.from.r][move.from.c];

        board[move.from.r][move.from.c] = null;

        // Prise en passant
        if (move.enPassant) {
            board[move.from.r][move.to.c] = null;
        }

        // Roque
        if (move.castle === 'K') {
            board[move.from.r][5] = board[move.from.r][7];
            board[move.from.r][7] = null;
        } else if (move.castle === 'Q') {
            board[move.from.r][3] = board[move.from.r][0];
            board[move.from.r][0] = null;
        }

        // Promotion ou déplacement normal
        board[move.to.r][move.to.c] = {
            color: piece.color,
            type: move.promotion || piece.type
        };

        // Mise à jour de la cible en passant
        let enPassant = null;
        if (piece.type === 'p' && Math.abs(move.to.r - move.from.r) === 2) {
            enPassant = { r: (move.from.r + move.to.r) / 2, c: move.from.c };
        }

        // Mise à jour des droits au roque
        if (piece.type === 'k') {
            if (piece.color === 'w') {
                castling.wK = false;
                castling.wQ = false;
            } else {
                castling.bK = false;
                castling.bQ = false;
            }
        }
        if (move.from.r === 7 && move.from.c === 0) castling.wQ = false;
        if (move.from.r === 7 && move.from.c === 7) castling.wK = false;
        if (move.from.r === 0 && move.from.c === 0) castling.bQ = false;
        if (move.from.r === 0 && move.from.c === 7) castling.bK = false;
        if (move.to.r === 7 && move.to.c === 0) castling.wQ = false;
        if (move.to.r === 7 && move.to.c === 7) castling.wK = false;
        if (move.to.r === 0 && move.to.c === 0) castling.bQ = false;
        if (move.to.r === 0 && move.to.c === 7) castling.bK = false;

        return {
            board,
            turn: state.turn === 'w' ? 'b' : 'w',
            castling,
            enPassant
        };
    },

    getPseudoLegalMoves(state, color) {
        const moves = [];
        const { board, castling, enPassant } = state;
        const enemy = color === 'w' ? 'b' : 'w';

        const addPawnMove = (from, to, extra = {}) => {
            const promoRow = color === 'w' ? 0 : 7;
            if (to.r === promoRow) {
                for (const promo of ['q', 'r', 'b', 'n']) {
                    moves.push({ from, to, promotion: promo, ...extra });
                }
            } else {
                moves.push({ from, to, ...extra });
            }
        };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p || p.color !== color) continue;
                const from = { r, c };

                if (p.type === 'p') {
                    const dir = color === 'w' ? -1 : 1;
                    const startRow = color === 'w' ? 6 : 1;

                    // Avance simple
                    if (this.inBounds(r + dir, c) && !board[r + dir][c]) {
                        addPawnMove(from, { r: r + dir, c });
                        // Double avance
                        if (r === startRow && !board[r + 2 * dir][c]) {
                            moves.push({ from, to: { r: r + 2 * dir, c } });
                        }
                    }

                    // Captures diagonales & en passant
                    for (const dc of [-1, 1]) {
                        const nr = r + dir;
                        const nc = c + dc;
                        if (!this.inBounds(nr, nc)) continue;
                        const target = board[nr][nc];
                        if (target && target.color === enemy) {
                            addPawnMove(from, { r: nr, c: nc }, { captured: target.type });
                        } else if (enPassant && enPassant.r === nr && enPassant.c === nc) {
                            moves.push({ from, to: { r: nr, c: nc }, enPassant: true, captured: 'p' });
                        }
                    }
                } else if (p.type === 'n') {
                    const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
                    for (const [dr, dc] of offsets) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (!this.inBounds(nr, nc)) continue;
                        const target = board[nr][nc];
                        if (!target || target.color === enemy) {
                            moves.push({ from, to: { r: nr, c: nc }, captured: target?.type });
                        }
                    }
                } else if (p.type === 'b' || p.type === 'r' || p.type === 'q') {
                    const dirs = [];
                    if (p.type === 'b' || p.type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
                    if (p.type === 'r' || p.type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

                    for (const [dr, dc] of dirs) {
                        let nr = r + dr;
                        let nc = c + dc;
                        while (this.inBounds(nr, nc)) {
                            const target = board[nr][nc];
                            if (!target) {
                                moves.push({ from, to: { r: nr, c: nc } });
                            } else {
                                if (target.color === enemy) {
                                    moves.push({ from, to: { r: nr, c: nc }, captured: target.type });
                                }
                                break;
                            }
                            nr += dr;
                            nc += dc;
                        }
                    }
                } else if (p.type === 'k') {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (!this.inBounds(nr, nc)) continue;
                            const target = board[nr][nc];
                            if (!target || target.color === enemy) {
                                moves.push({ from, to: { r: nr, c: nc }, captured: target?.type });
                            }
                        }
                    }

                    // Roques
                    const homeRow = color === 'w' ? 7 : 0;
                    if (r === homeRow && c === 4 && !this.isSquareAttacked(board, homeRow, 4, enemy)) {
                        const canK = color === 'w' ? castling.wK : castling.bK;
                        const canQ = color === 'w' ? castling.wQ : castling.bQ;

                        if (
                            canK &&
                            !board[homeRow][5] && !board[homeRow][6] &&
                            !this.isSquareAttacked(board, homeRow, 5, enemy) &&
                            !this.isSquareAttacked(board, homeRow, 6, enemy)
                        ) {
                            moves.push({ from, to: { r: homeRow, c: 6 }, castle: 'K' });
                        }
                        if (
                            canQ &&
                            !board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3] &&
                            !this.isSquareAttacked(board, homeRow, 3, enemy) &&
                            !this.isSquareAttacked(board, homeRow, 2, enemy)
                        ) {
                            moves.push({ from, to: { r: homeRow, c: 2 }, castle: 'Q' });
                        }
                    }
                }
            }
        }

        return moves;
    },

    getLegalMoves(state, color) {
        const pseudo = this.getPseudoLegalMoves(state, color);
        return pseudo.filter(move => {
            const nextState = this.applyMove(state, move);
            return !this.isKingInCheck(nextState.board, color);
        });
    },

    isInsufficientMaterial(board) {
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.type !== 'k') pieces.push(p);
            }
        }
        if (pieces.length === 0) return true;
        if (pieces.length === 1 && (pieces[0].type === 'n' || pieces[0].type === 'b')) return true;
        return false;
    },

    // =========================================================
    // IA : MINIMAX + ÉLAGAGE ALPHA-BETA (JOUE LES NOIRS)
    // =========================================================

    evaluateBoard(board) {
        const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        let score = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) continue;

                // Bonus léger de contrôle du centre et d'avancée des pions
                const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
                let posBonus = Math.round((7 - centerDist) * 4);
                if (p.type === 'p') {
                    posBonus += p.color === 'b' ? r * 8 : (7 - r) * 8;
                }

                const val = values[p.type] + posBonus;
                score += p.color === 'b' ? val : -val;
            }
        }

        return score;
    },

    orderMoves(moves) {
        const pieceScore = { q: 9, r: 5, b: 3, n: 3, p: 1 };
        return moves.sort((a, b) => {
            const scoreA = (a.captured ? 10 * (pieceScore[a.captured] || 1) : 0) + (a.promotion ? 8 : 0);
            const scoreB = (b.captured ? 10 * (pieceScore[b.captured] || 1) : 0) + (b.promotion ? 8 : 0);
            return scoreB - scoreA;
        });
    },

    minimax(state, depth, alpha, beta, isMaximizing) {
        const color = isMaximizing ? 'b' : 'w';
        const moves = this.getLegalMoves(state, color);

        if (moves.length === 0) {
            if (this.isKingInCheck(state.board, color)) {
                // Favorise les mats les plus rapides
                return isMaximizing ? -100000 - depth : 100000 + depth;
            }
            return 0; // Pat
        }

        if (depth === 0) {
            return this.evaluateBoard(state.board);
        }

        this.orderMoves(moves);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                // Pour l'IA, inutile d'explorer les sous-promotions inutiles
                if (move.promotion && move.promotion !== 'q') continue;
                const nextState = this.applyMove(state, move);
                const ev = this.minimax(nextState, depth - 1, alpha, beta, false);
                if (ev > maxEval) maxEval = ev;
                if (ev > alpha) alpha = ev;
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                if (move.promotion && move.promotion !== 'q') continue;
                const nextState = this.applyMove(state, move);
                const ev = this.minimax(nextState, depth - 1, alpha, beta, true);
                if (ev < minEval) minEval = ev;
                if (ev < beta) beta = ev;
                if (beta <= alpha) break;
            }
            return minEval;
        }
    },

    findBestMove(state, depth) {
        const moves = this.getLegalMoves(state, 'b').filter(m => !m.promotion || m.promotion === 'q');
        if (moves.length === 0) return null;

        this.orderMoves(moves);

        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of moves) {
            const nextState = this.applyMove(state, move);
            const score = this.minimax(nextState, depth - 1, -Infinity, Infinity, false);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
};