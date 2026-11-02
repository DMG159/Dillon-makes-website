# Working with Dillon on this project

## Ask before recommending
- When a recommendation depends on a requirement you're assuming, ask about that requirement before recommending. Don't treat the current state of something as a fixed constraint.
  - Example: the repo was private, so I ruled out GitHub Pages and recommended Cloudflare without asking whether it needed to stay private. It didn't. GitHub Pages turned out to be the easier and faster choice.
- For hosting, tooling, or service choices, briefly confirm the constraints that would change the answer (privacy, budget, custom domain, who maintains it) before picking one.
- Prefer the simplest option that fits. Mention more involved options only when a stated requirement calls for them.

## Project facts
- Static site (HTML/CSS/JS, no build step) hosted on **GitHub Pages** from the `main` branch, root folder.
- Domain: **dillonmakes.tech** (registered at Namecheap; set in the `CNAME` file). Original Pages URL: https://dmg159.github.io/Dillon-makes-website/
- The repo is public.
- Contact form: FormSubmit, configured in `config.js`. Contact address `dillon@dillonmakes.tech` forwards to Dillon's Gmail via Namecheap email forwarding.
- Brand: wood-grain "DMG" logo in `assets/`, wood tones as the only accent color, minimal black/off-white style with Geist and Geist Mono fonts. Light and dark modes follow the device setting; the header toggle overrides it and saves the choice in a `theme` cookie (1 year).
- Push site changes to `main` so they go live.
