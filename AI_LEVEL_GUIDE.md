# AI Level Guide - Noël Anti-IA CAPTCHA Engine

## Purpose
This document provides the exact specification for creating new CAPTCHA levels for the "Noël Anti-IA" project. Follow this guide precisely to ensure compatibility with the core engine.

---

## File Structure & Naming Convention

```
js/levels/
├── level1.js      (existing example)
├── level2.js      (existing example)
└── level3.js      (your new level)
```

**Naming:** `levelN.js` where N is the next sequential number (3, 4, 5...).

**Location:** Always inside `js/levels/` directory.

---

## Module Interface Contract

Each level file must export a single default object with this structure:

```javascript
export default {
    id: string,           // Unique identifier (e.g., 'level3', 'snowball-throw')
    title: string,        // Displayed in the CAPTCHA blue header bar
    subtitle?: string,    // Optional secondary instruction below the header
    mount(container, engineAPI): void,   // Render the level UI
    verify?(engineAPI): void,             // Called when user clicks VÉRIFIER
    unmount(): void                 // Cleanup before next level loads
};
```

### Required Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | `string` | Unique identifier for this level | `'level3'`, `'snowball-throw'` |
| `title` | `string` | Shown in the blue CAPTCHA header | `"Sélectionnez tous les sapins de 2m"` |
| `subtitle` | `string \| undefined` | Secondary instruction text | `"Les sapins trop grands sont des faux."` |
| `mount` | `function` | Renders the level's interactive UI into `container` | See below |
| `verify` | `function \| undefined` | Called on VÉRIFIER button click. If absent, use `engineAPI.pass()` for instant-win triggers | See below |
| `unmount` | `function` | Cleanup: remove event listeners, intervals, animations | Always required |

### Engine API Methods (passed to `mount` and `verify`)

| Method | Signature | Description |
|--------|-----------|-------------|
| `pass()` | `() => void` | Completes the level, shows success animation, advances to next level |
| `fail(message?)` | `(message?: string) => void` | Triggers shake animation + red error message. Default: `"Échec de la vérification. Réessayez."` |
| `setVerifyButtonEnabled(enabled)` | `(enabled: boolean) => void` | Enables/disables the VÉRIFIER button. When enabled, button gets blue background |
| `getCurrentLevelIndex()` | `() => number` | Returns current 0-based level index |
| `getTotalLevels()` | `() => number` | Returns total number of levels |
| `getProgress()` | `() => number` | Returns current progress as percentage (0-100) |

---

## DOM & CSS Scoping Rules

### CRITICAL: Never break the main UI

1. **Only append children to `container`** - This is the parameter passed to `mount()`. The engine injects this element into `#captchaContent`.

2. **Use CSS classes scoped to your level** - Prefix your custom CSS classes with a unique identifier like `.level3-` or `.snowball-` to avoid conflicts with the core CSS.

3. **Do NOT modify:**
   - `#captchaCard` (the entire CAPTCHA card)
   - `#captchaTitle` (the header title)
   - `#captchaSubtitle` (the subtitle text)
   - `#progressBar`, `#progressFill`, `#progressText`
   - `#verifyBtn` (the verify button)
   - Any element outside of `container`

4. **Do NOT set `display: none`** on the card or any engine-managed element.

5. **Remove all event listeners in `unmount()`** - Use the cleanup function pattern to avoid memory leaks and phantom events on the next level load.

---

## Language Requirements

**ALL user-facing text MUST be in French.** This includes:
- `title` - The CAPTCHA header prompt
- `subtitle` - Secondary instructions
- Error messages passed to `engineAPI.fail()`
- Any labels, buttons, or hints rendered inside `container`
- Success/failure feedback text

**Tone:** Humorous, Christmas-themed, anti-AI. Examples of good tone:
- `"Sélectionnez tous les carrés contenant un lutin fatigué"`
- `"Le Père Noël a trop mangé de madeleines, il doit se calmer."`
- Error: `"Attention, c'était un renne pas un chien ! Réessayez."`

---

## Boilerplate Template

Copy-paste this template and fill in the blanks:

```javascript
export default {
    id: 'levelN',

    title: 'Votre instruction CAPTCHA en français ici',

    subtitle: 'Instruction secondaire optionnelle en français.',

    mount(container, engineAPI) {
        // Store reference for cleanup
        this.engineAPI = engineAPI;

        // Create DOM elements and append ONLY to container
        const wrapper = document.createElement('div');
        wrapper.className = 'levelN-wrapper';
        container.appendChild(wrapper);

        // Set up event listeners
        const myButton = document.createElement('button');
        myButton.textContent = 'Action';
        myButton.addEventListener('click', () => {
            // Check win condition
            if (/* user succeeded */) {
                engineAPI.pass();
            } else {
                engineAPI.fail('Message d\'erreur humoristique en français.');
            }
        });
        wrapper.appendChild(myButton);

        // For instant-win interactions (no verify button needed):
        // Call engineAPI.setVerifyButtonEnabled(true) when user makes a valid selection
        // The VÉRIFIER button will turn blue and be clickable
    },

    verify(engineAPI) {
        // Called when user clicks the VÉRIFIER button
        if (/* win condition met */) {
            engineAPI.pass();
        } else {
            engineAPI.fail('Message d\'erreur humoristique en français.');
        }
    },

    unmount() {
        // Remove ALL event listeners, intervals, animations
        // Clear any references to engineAPI
        this.engineAPI = null;

        // If you added global event listeners (mousemove, touchmove, etc.),
        // remove them here using the cleanup function pattern:
        if (this.cleanup) this.cleanup();
    }
};
```

---

## Adding Your Level to the Engine

After creating `js/levels/levelN.js`, register it in `js/engine.js`:

```javascript
import level1 from './levels/level1.js';
import level2 from './levels/level2.js';
import level3 from './levels/level3.js';  // Add your import

const LEVELS = [level1, level2, level3];  // Add to array
```

---

## Validation Checklist

Before submitting a new level, verify:

- [ ] File is at `js/levels/levelN.js` with correct naming
- [ ] Default export is a plain object (not a class or function)
- [ ] `id`, `title`, `mount`, and `unmount` are present
- [ ] All text is in French with humorous/Christmas tone
- [ ] Only appends to `container` parameter
- [ ] CSS classes are prefixed/scoped to avoid conflicts
- [ ] `unmount()` cleans up all event listeners
- [ ] Level is imported and added to `LEVELS` array in `js/engine.js`
- [ ] Tested with `python -m http.server` or equivalent local server

---

## Common Patterns

### Pattern 1: Checkbox (like Level 1)
```javascript
mount(container, engineAPI) {
    const checkbox = document.createElement('label');
    checkbox.className = 'captcha-checkbox-container';
    checkbox.innerHTML = `
        <div class="custom-checkbox"></div>
        <span class="captcha-checkbox-label">Je ne suis pas un robot</span>
    `;
    checkbox.addEventListener('click', () => {
        checkbox.querySelector('.custom-checkbox').classList.toggle('checked');
        engineAPI.setVerifyButtonEnabled(true);
    });
    container.appendChild(checkbox);
}
```

### Pattern 2: Canvas Drawing
```javascript
mount(container, engineAPI) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    // ... drawing logic
}
```

### Pattern 3: Text Input with verify()
```javascript
mount(container, engineAPI) {
    const input = document.createElement('input');
    input.className = 'captcha-text-input';
    input.placeholder = 'Entrez la réponse secrète...';
    container.appendChild(input);

    this.input = input; // Store reference for verify()
}

verify(engineAPI) {
    if (this.input.value.toLowerCase() === 'noel') {
        engineAPI.pass();
    } else {
        engineAPI.fail('Mauvaise réponse. Indice : c\'est la fête !');
    }
}
```
