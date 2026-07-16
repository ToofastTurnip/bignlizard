# Big n Lizard (bignlizard.com)

Static marketing site for Big n Lizard, an indie fantasy board game company. Plain HTML/CSS/JS, no build step, no framework, no dependencies to install.

## Structure

```
index.html       All page markup (hero, upcoming games, news/events, about, footer)
css/styles.css   All styling (design tokens at the top of the file)
js/main.js       Mobile nav toggle, scroll-reveal, footer year, header scroll shadow
assets/          favicon, hero stone-wall background texture
CNAME            Custom domain for GitHub Pages (bignlizard.com)
```

## Editing content

Everything is placeholder copy for the client to swap in real content:

- **Upcoming Games** (`index.html`, `#games` section): 3 sample `game-card` entries. Swap in real titles, blurbs, player counts, and status badges (`status-dev` / `status-playtest` / `status-soon`).
- **Company News & Events** (`index.html`, `#news` section): 4 sample `news-item` entries. Swap in real convention dates/locations and announcements.
- **Contact email**: currently `hello@bignlizard.com`. Update the two `mailto:` links in `index.html`.
- **Social links**: footer icons currently point to `#`. Add real Instagram / BoardGameGeek / Discord URLs.
- **Logo/crest**: the circular emblem is a placeholder built in SVG (a stylized lizard curled in a badge). Swap the inline `<svg class="brand-crest">` / `<svg class="hero-crest">` markup for real artwork whenever the client has a finished logo.

## Preview locally

No install needed. Just serve the folder (opening `index.html` directly also works, but a local server avoids any browser file:// quirks):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a new GitHub repo and push this folder to it (`main` branch).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save. GitHub will publish at `https://<username>.github.io/<repo>/`.
5. To use the custom domain (`bignlizard.com`), the `CNAME` file is already in place. Just add the DNS records GitHub's Pages docs specify (A records to GitHub's IPs, or a CNAME record if using a `www` subdomain), then enter the domain in **Settings → Pages → Custom domain**.

If you don't want the custom domain yet, delete the `CNAME` file and the site will work fine at the default `github.io` URL.
