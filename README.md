# Neilz Network Website

Professional web design & hosting portfolio for Neilz Network, built by Simon Neilz.

**Tech stack:** Vanilla HTML, CSS, JavaScript — no frameworks, no build tools. Works on GitHub Pages out of the box.

---

## Quick Start

### 1. Edit your content

All site content lives in one file: `data/services.json`. Open it in any text editor to change:

- Business name, owner name, email address
- Hero tagline and subtitle
- About section text
- Service names, descriptions, prices, and feature lists
- Process step titles and descriptions
- Footer copyright text
- Admin panel password

### 2. Set your admin password

In `data/services.json`, find the `adminPassword` field and change it:

```json
{
  "adminPassword": "your-strong-password-here",
  ...
}
```

> **Note:** Because this is a static site, the password is readable in the JSON file. Keep your GitHub repository **private**, or use a strong, unique password.

### 3. Test locally

Because the site fetches `data/services.json` via `fetch()`, you need a local HTTP server to test — opening `index.html` directly as a `file://` URL will be blocked by the browser.

**Option A — VS Code Live Server**
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `index.html`, and click **Open with Live Server**.

**Option B — Node.js**
```bash
npx serve .
# Then open http://localhost:3000
```

**Option C — Python**
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

---

## Deploy to GitHub Pages

### Step 1 — Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in (or create a free account)
2. Click **New repository**
3. Name it (e.g. `neilznetwork`)
4. Set visibility to **Public** (required for free GitHub Pages)
5. Click **Create repository**

### Step 2 — Push your files

With Git installed ([git-scm.com](https://git-scm.com)):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. In your repo, go to **Settings → Pages**
2. Under *Source*, select **Deploy from a branch**
3. Choose `main` branch and `/ (root)` folder
4. Click **Save**

Your site will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

### Step 4 — Connect a custom domain (optional)

1. In **Settings → Pages → Custom domain**, enter your domain (e.g. `neilznetwork.com`)
2. Update your domain's DNS records:

```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  YOUR_USERNAME.github.io
```

3. DNS propagation takes up to 24 hours
4. Once verified, enable **Enforce HTTPS** in the Pages settings

---

## Using the Admin Panel

Navigate to `yoursite.com/admin/` (or `http://localhost:PORT/admin/` locally).

The admin panel lets you:
- Edit all three service cards (name, description, price, features, badge, icon)
- Edit site meta info (owner name, email, tagline, about text, footer text)
- Change the admin password
- Download the updated `services.json`

**To publish changes:**
1. Log in at `/admin/` and make your edits
2. Click **Download services.json**
3. Replace `data/services.json` in your project folder
4. Push to GitHub:

```bash
git add data/services.json
git commit -m "Update services"
git push
```

GitHub Pages will rebuild within ~60 seconds.

---

## Setting Up the Contact Form

The contact form uses `mailto:` by default, which opens the visitor's email client. This works immediately with no setup.

For proper server-side form submissions (so you receive emails directly):

1. Sign up free at [formspree.io](https://formspree.io)
2. Create a new form pointed at your email
3. In `index.html`, find the `<form>` tag and update its `action`:

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

---

## File Structure

```
/
├── index.html              # Main site
├── css/
│   └── style.css           # All styles
├── js/
│   └── main.js             # Frontend logic & JSON loading
├── data/
│   └── services.json       # ← All editable content lives here
├── admin/
│   ├── index.html          # Admin panel
│   └── admin.js            # Admin logic
└── README.md
```

---

## Customization Notes

- **Colors:** Edit CSS custom properties at the top of `css/style.css` (`:root { ... }`) to change the color scheme
- **Fonts:** The site uses [Inter](https://fonts.google.com/specimen/Inter) from Google Fonts — swap the `<link>` tag in `index.html` to use a different font
- **Process steps:** Add or remove steps in the `processSteps` array in `services.json` (the grid adjusts automatically)
- **Services:** Add or remove services via the admin panel or directly in `services.json` — the grid is CSS-grid and will reflow

---

*Built with ♦ by Simon Neilz — Neilz Network*
