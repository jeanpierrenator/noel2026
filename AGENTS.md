# Noël Anti-IA - CAPTCHA Game Project

## Project Overview
A web-based humorous CAPTCHA game inspired by Neal.fun's "I'm Not a Robot". Players must solve absurd, Christmas-themed CAPTCHA challenges to reveal a secret Christmas riddle. Designed to prevent AI cheating through absurdity and humor.

## File Tree

```
Site web capcha noel/
├── index.html              # Main HTML entry point
├── css/
│   └── style.css           # All styling (reCAPTCHA-inspired UI)
├── js/
│   ├── engine.js           # Core state machine & level manager
│   └── levels/
│       ├── level1.js       # Grid selection level (find the sleeping elf)
│       └── level2.js       # Slider level (calm down angry Santa)
├── AI_LEVEL_GUIDE.md       # Technical spec for creating new CAPTCHA levels (AI-focused)
└── AGENTS.md               # This file (project structure & doc locations)
```

## Documentation Locations

- **Project structure:** This file (`AGENTS.md`)
- **Level creation spec:** `AI_LEVEL_GUIDE.md` - Complete interface contract, boilerplate template, and patterns for creating new CAPTCHA levels
- **Core engine:** `js/engine.js` - State machine, level queue, transitions, final screen

## Running the Project

```bash
# Option 1: Python
cd "C:\dvl\Site web capcha noel"
python -m http.server 8085
# Visit: http://localhost:8085

# Option 2: Node.js npx
npx serve "C:\dvl\Site web capcha noel"
```

## Tech Stack
- Pure Vanilla HTML5 + CSS3 + ES6+ JavaScript
- Native ES Modules (`type="module"`)
- No build tools, no frameworks
- All user-facing text in French with humorous/Christmas tone
