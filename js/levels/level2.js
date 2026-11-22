export default {
    id: 'level2',
    title: 'Aidez le Père Noël à se calmer',
    subtitle: 'Glissez le curseur vers la droite jusqu\'à ce que le Père Noël soit détendu.',

    mount(container, engineAPI) {
        this.engineAPI = engineAPI;
        this.threshold = 75;
        this.currentValue = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startValue = 0;

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'captcha-slider-container';

        const track = document.createElement('div');
        track.className = 'captcha-slider-track';

        const fill = document.createElement('div');
        fill.className = 'captcha-slider-fill';

        const trackText = document.createElement('div');
        trackText.className = 'captcha-slider-text';
        trackText.textContent = '🤬 Colère → Détente 😌';

        const thumb = document.createElement('div');
        thumb.className = 'captcha-slider-thumb';

        track.appendChild(fill);
        track.appendChild(trackText);
        track.appendChild(thumb);
        sliderContainer.appendChild(track);
        container.appendChild(sliderContainer);

        this.track = track;
        this.fill = fill;
        this.thumb = thumb;

        const handleStart = (clientX) => {
            this.isDragging = true;
            this.startX = clientX;
            this.startValue = this.currentValue;
        };

        const handleMove = (clientX) => {
            if (!this.isDragging) return;
            const trackRect = this.track.getBoundingClientRect();
            const deltaX = clientX - this.startX;
            const deltaPercent = (deltaX / trackRect.width) * 100;
            this.currentValue = Math.max(0, Math.min(100, this.startValue + deltaPercent));
            this.updateSlider();

            if (this.currentValue >= this.threshold) {
                engineAPI.setVerifyButtonEnabled(true);
            } else {
                engineAPI.setVerifyButtonEnabled(false);
            }
        };

        const handleEnd = () => {
            this.isDragging = false;
        };

        thumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleStart(e.clientX);
        });

        document.addEventListener('mousemove', (e) => handleMove(e.clientX));
        document.addEventListener('mouseup', handleEnd);

        thumb.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleStart(e.touches[0].clientX);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) handleMove(e.touches[0].clientX);
        }, { passive: true });

        document.addEventListener('touchend', handleEnd);

        this.cleanup = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };

        this.updateSlider();
    },

    updateSlider() {
        this.fill.style.width = `${this.currentValue}%`;
        this.thumb.style.left = `calc(${this.currentValue}% - 18px)`;

        if (this.currentValue >= 90) {
            this.thumb.textContent = '😌';
        } else if (this.currentValue >= 60) {
            this.thumb.textContent = '🙂';
        } else if (this.currentValue >= 30) {
            this.thumb.textContent = '😠';
        } else {
            this.thumb.textContent = '🤬';
        }
    },

    verify(engineAPI) {
        if (this.currentValue >= this.threshold) {
            engineAPI.pass();
        } else {
            engineAPI.fail('Le Père Noël est encore trop énervé ! Glissez plus loin.');
        }
    },

    unmount() {
        if (this.cleanup) {
            this.cleanup();
        }
        this.engineAPI = null;
    }
};
