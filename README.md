# GitHub Pages starter site

This repository contains a simple, static website scaffold ready to publish with GitHub Pages.

## What’s included
- `index.html` for the homepage content
- `archive.html` for the blog-style archive page
- `styles.css` for the site styling
- `script.js` for the sticky header and archive interactions
- `favicon.svg` for the browser tab icon
- `content/posts.json` for archive content data
- `.github/workflows/pages.yml` to publish the site with GitHub Actions
- `404.html` for friendly missing-page handling

## Content structure
Blog content lives in `content/posts.json`. Each entry should include:
- `id`: a unique slug for the post
- `title`: the article title
- `excerpt`: a short summary shown on archive cards
- `date`: the publication date in ISO format
- `year`: the year used by the archive filter
- `topic`: the topic used by the archive filter
- `featured`: whether the post should appear in the featured section
- `readingTime`: a short label shown beneath the post summary

Add or edit entries in `content/posts.json` to grow the archive without changing the page templates.

## Publish to GitHub Pages
1. Commit and push this repository to GitHub.
2. Open the repository’s Settings → Pages.
3. Select “GitHub Actions” as the deployment source.
4. Wait for the workflow to finish, then visit your Pages URL.

## Customize the site
- Update the copy in `index.html` and `archive.html`.
- Adjust the colors and layout in `styles.css`.
- Replace the placeholder contact details and organization name.
- If you use a custom domain, add a `CNAME` file with your domain.
