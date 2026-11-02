# Dillon Makes

The website for **Dillon Makes**, offering AI training, AI automation pipelines (Zapier, Make, n8n), and AI-built scripts and websites.

It's a static site with no build step: plain HTML, CSS and JavaScript.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page content and sections |
| `styles.css` | Styling and responsive layout |
| `script.js` | Mobile menu, scroll animations, contact form |
| `config.js` | **Your contact email address** |
| `favicon.svg` | Browser tab icon |

## Set up the contact form

1. Open `config.js` and replace `you@example.com` with the address that should receive messages.
2. Deploy the site, then submit one test message through the form.
3. [FormSubmit](https://formsubmit.co) emails that address a one-time **activation link**. Click it, and messages will arrive in your inbox from then on.

Replies go straight to the visitor, because their email address is set as the reply-to address. If the form service can't be reached, the form opens the visitor's own email app with the message already filled in.

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy (free options)

- **GitHub Pages:** in the repo, go to Settings → Pages, then deploy from your branch's root folder.
- **Netlify / Cloudflare Pages / Vercel:** import the repo. No build command is needed, and the publish directory is `/`.
