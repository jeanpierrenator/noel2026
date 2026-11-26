export default {
    id: 'level0',
    title: 'Vérification de sécurité',

    mount(container, engineAPI) {
        console.log('level0 mount called');
        this.engineAPI = engineAPI;

        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'captcha-checkbox-container';
        checkboxContainer.id = 'initialCheckbox';

        const checkbox = document.createElement('div');
        checkbox.className = 'captcha-checkbox';
        checkbox.id = 'level0CheckboxInner';

        const label = document.createElement('span');
        label.className = 'captcha-checkbox-label';
        label.textContent = 'Vérifiez que vous êtes un humain - Mirion Captcha';

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        container.appendChild(checkboxContainer);

        checkboxContainer.addEventListener('click', () => {
            if (checkbox.classList.contains('checked')) {
                return;
            }
            checkbox.classList.add('checked');
            engineAPI.setVerifyButtonEnabled(true);
        });
    },

    verify(engineAPI) {
        const checkbox = document.getElementById('level0CheckboxInner');
        if (checkbox.classList.contains('checked')) {
            engineAPI.pass();
        } else {
            engineAPI.fail('Veuillez cocher la case pour continuer.');
        }
    },

    unmount() {
        this.engineAPI = null;
    }
};
