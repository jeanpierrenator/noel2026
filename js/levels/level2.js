export default {
    id: 'level2',
    title: 'Quelle est la dose affichée sur ce dosimètre ?',
    subtitle: 'Prouvez que vous savez lire un écran LCD comme un vrai humain.',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;

        const style = document.createElement('style');
        style.textContent = `
            .level2-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                user-select: none;
            }
            .level2-img-box {
                width: 100%;
                max-width: 300px;
                background: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 8px;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .level2-img {
                width: 100%;
                max-height: 180px;
                object-fit: contain;
                display: block;
                pointer-events: none;
            }
            .level2-input-group {
                width: 100%;
                max-width: 300px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .level2-input {
                width: 100%;
                padding: 10px 12px;
                font-size: 15px;
                border: 2px solid #dadce0;
                border-radius: 4px;
                box-sizing: border-box;
                outline: none;
                text-align: center;
                transition: border-color 0.15s;
            }
            .level2-input:focus {
                border-color: #1a73e8;
            }
            .level2-hint {
                font-size: 11px;
                color: #666;
                text-align: center;
            }
            .level2-error-img {
                padding: 20px;
                text-align: center;
                font-size: 13px;
                color: #d93025;
            }
        `;
        container.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'level2-wrapper';

        const imgBox = document.createElement('div');
        imgBox.className = 'level2-img-box';

        const img = document.createElement('img');
        img.className = 'level2-img';
        img.src = 'asset/dmc3000.webp';
        img.alt = 'Dosimètre DMC 3000';
        img.draggable = false;

        img.onerror = () => {
            img.style.display = 'none';
            const err = document.createElement('div');
            err.className = 'level2-error-img';
            err.textContent = 'Image introuvable : vérifiez que asset/dmc3000.webp existe bien.';
            imgBox.appendChild(err);
        };

        imgBox.appendChild(img);

        const inputGroup = document.createElement('div');
        inputGroup.className = 'level2-input-group';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'level2-input';
        input.placeholder = 'Ex : 20 µSv';
        input.autocomplete = 'off';
        this.input = input;

        const handleInput = () => {
            engineAPI.setVerifyButtonEnabled(input.value.trim().length > 0);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && input.value.trim().length > 0) {
                e.preventDefault();
                this.verify(engineAPI);
            }
        };

        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeyDown);

        const hint = document.createElement('div');
        hint.className = 'level2-hint';
        hint.textContent = 'Indiquez la valeur affichée sur l\'écran du dosimètre.';

        inputGroup.appendChild(input);
        inputGroup.appendChild(hint);

        wrapper.appendChild(imgBox);
        wrapper.appendChild(inputGroup);
        container.appendChild(wrapper);

        this.cleanup = () => {
            input.removeEventListener('input', handleInput);
            input.removeEventListener('keydown', handleKeyDown);
        };

        engineAPI.setVerifyButtonEnabled(false);
        setTimeout(() => input.focus(), 50);
    },

    verify(engineAPI) {
        if (!this.input) return;

        const raw = this.input.value.trim();
        if (!raw) {
            engineAPI.fail('Veuillez saisir la dose affichée.');
            return;
        }

        // Normalisation : minuscules, suppression des espaces et uniformisation du symbole µ
        const normalized = raw
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/μ/g, 'µ');

        const acceptedAnswers = new Set([
            '20',
            '20µsv',
            '20usv',
            '20microsievert',
            '20microsieverts'
        ]);

        if (acceptedAnswers.has(normalized)) {
            engineAPI.pass();
        } else if (normalized.includes('3000')) {
            engineAPI.fail('3000, c\'est le modèle du dosimètre (DMC 3000), pas la dose !');
        } else if (normalized.includes('10') || normalized.includes('h10')) {
            engineAPI.fail('H10, c\'est la grandeur mesurée, regardez plutôt les gros chiffres !');
        } else {
            engineAPI.fail('Mauvaise lecture ! Un robot confondrait les chiffres, pas vous.');
        }
    },

    unmount() {
        if (this.cleanup) {
            this.cleanup();
            this.cleanup = null;
        }
        this.input = null;
        this.engineAPI = null;
    }
};