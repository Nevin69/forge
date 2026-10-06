# Publish Forge as a public website

GitHub stores your source code. **GitHub Pages** serves the built website so anyone can open it without signing in. A public repository works with GitHub's free plan.

This project now includes a separate static build and `.github/workflows/pages.yml`. The workflow installs dependencies, checks the code, tests it, builds the website and publishes it. It automatically handles the repository name in the website address. No API keys or hosting secrets are required.

## 1. Create an empty GitHub repository

Sign in at https://github.com and use **+ → New repository**:

- Repository name: `forge` (or a name you prefer).
- Visibility: **Public**.
- Leave README, `.gitignore` and licence initialization unchecked because these local files already exist.
- Click **Create repository**.

Copy the HTTPS repository URL shown on GitHub, such as `https://github.com/YOUR-USERNAME/forge.git`.

## 2. Upload this project

Open Terminal on your Mac. Run these commands, replacing `YOUR-USERNAME` and `forge` in the repository URL with your actual values:

```sh
cd "/Users/nevinjojo7/DIET TRACKER/forge"
git add .
git commit -m "Prepare Forge for GitHub Pages"
git remote add github https://github.com/YOUR-USERNAME/forge.git
git push -u github HEAD:main
```

The project is already a Git repository, so `git init` is unnecessary. This adds a separate remote named `github`. If `github` already exists, inspect `git remote -v` and use `git remote set-url github YOUR-REPOSITORY-URL` instead of `git remote add`.

If Git asks for your identity, set `git config user.name "Your name"` and `git config user.email "Your GitHub email"`, then repeat the commit. You may use GitHub's no-reply email.

GitHub no longer accepts account passwords for Git HTTPS pushes. Use GitHub Desktop's sign-in flow, GitHub CLI authentication, or a personal access token when Git asks for a password. Never paste a token into project files or chat.

If you prefer a graphical tool, install GitHub Desktop from https://desktop.github.com, sign in, choose **File → Add Local Repository**, select this project's `forge` folder, commit the changes, and use **Publish repository**. Uncheck **Keep this code private**. With this route, Desktop creates the repository for you, so skip step 1.

## 3. Enable GitHub Pages

On the repository's GitHub page:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open the **Actions** tab.
4. Choose **Publish Forge to GitHub Pages** and click **Run workflow** on `main` if a successful deployment has not already run. An initial run may fail before you enable Pages; rerun it after enabling Pages.
5. Wait until the run succeeds. The deployment link appears in the workflow and **Settings → Pages**.

For a repository named `forge`, the usual address is:

```text
https://YOUR-USERNAME.github.io/forge/
```

Anyone can open that address. The repository address (`github.com/...`) shows source code; the website address (`github.io/...`) shows the app.

## 4. Publish future changes

```sh
git add .
git commit -m "Describe your update"
git push github HEAD:main
```

Every push to `main` rebuilds and publishes the site. If a deployment fails, open its Actions run and the failed step to see the error.

## Optional local check

Install Node.js 22.13+ first, then:

```sh
npm ci
GITHUB_PAGES_BASE=/forge/ npm run build:pages
GITHUB_PAGES_BASE=/forge/ npm run preview:pages
```

Open `http://localhost:4173/forge/`. Use your repository's path instead of `/forge/`. The generated website is in `dist-pages/`; the workflow uploads it for you.

## Personal journal privacy

Publishing makes the app and its source available to everyone. Each visitor's journal still saves only in their own browser's IndexedDB; their diary is not written to GitHub or shared with other visitors. A new website address has separate browser storage. Export a JSON backup from your current version and import it on the new address if you want to move your journal.

## Official references

- [GitHub: Creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [GitHub: Custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite: GitHub Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages)
