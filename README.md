# Dantong Li

A static Astro website for GitHub Pages. Content stays in this repository. The domain stays in AWS Route 53.

```mermaid
flowchart LR
  A[Content and code in GitHub] --> B[Actions checks and builds the site]
  B --> C[GitHub Pages serves the files]
  D[AWS Route 53 resolves the domain] --> C
```

## Edit content

| Change | File |
| --- | --- |
| Name, degree, contact links and skills | `src/data/profile.json` |
| Paper title, ordered authors, venue, links and BibTeX | `src/content/publications/*.md` |
| Exhibition order, short headlines and colours | `src/data/exhibition.json` |
| About composition | `src/pages/about.astro` |
| Portrait and other static files | `public/images/` |

Keep the same paper IDs in the publication files and exhibition data. All six approved works have individual pages and downloadable citations. The excluded fidelity-divergence paper is not included. The old résumé PDF is kept at its former URL for compatibility; the website does not link to it as a current résumé. Replace it only after the separate résumé update is approved.

The home exhibition uses six related diagrams. Routing positions come from the pinned compiler. The cosine curve and the tiny gate-cancellation circuit are exact teaching examples. The switch view shows coherent order histories and uses the stated one-qubit assumptions. Detection plus cancellation and Transformer-QEC use concept diagrams; they do not run new experiments or learned predictions. Each input changes a working part of its diagram. The interface has no general spin control or shared interaction bar.

Paper pages explain the task and idea before their small example. Four pages include a focused concept diagram. The route page links the exact compiler to its grid view in both directions. The PRL page also has a measurement atlas. The logical-qubit page keeps the paper’s reported Table II results; selecting them does not run a new simulation. Scope notes distinguish teaching calculations, concept diagrams and reported data.

## Run and check

Use Node 24.19.0 and pnpm 11.25.0, as pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
pnpm verify
pnpm preview
```

The build writes `dist/`. Run `verify` with the same environment values as `build`.

| Build setting | Default | Purpose |
| --- | --- | --- |
| `WEBSITE_ORIGIN` | `https://www.dantongli.com` | Canonical origin; no path |
| `WEBSITE_BASE` | `/` | `/` for the domain; `/repository-name/` for a project site |
| `WEBSITE_INDEXABLE` | `false` | Set to `true` only for the approved public build |

Preview builds include `noindex, nofollow` metadata and a blocking `robots.txt`. A production build with `WEBSITE_INDEXABLE=true` removes that metadata from normal pages and allows crawling. The 404 page remains unindexed. These settings control indexing; they do not make a public preview private.

The validation workflow checks a domain preview, a project-path preview and an indexable domain build. It verifies all six papers, author order, source links, citations, local links, profile corrections and the indexing policy. Linux builds also create and verify the former mixed-case PRL and résumé URLs. Each downloadable validation artifact is one `.tar` file, with both spellings preserved inside it. Windows cannot create those case-only copies, so local Windows verification reports that limit. The GitHub Pages deployment action also packages the site as a TAR archive before upload.

Paper text, citations, sources and navigation work without JavaScript. The two larger computational tools load when requested, within the paper page. Reduced-motion users receive a static presentation. Keyboard and touch users can use the same page links and controls. Visual inspection at desktop and phone widths is still needed when changing layout or motion.

## Publish after review

No hosting or DNS change is performed by a local build. The included deployment workflow runs only when manually started.

`netlify.toml` provides temporary Astro settings for the existing Netlify branch and pull request previews: `dist/`, the pinned Node and pnpm versions, and disabled indexing. It requires a working repository connection. The legacy Netlify integration currently fails during GitHub SSH checkout with `Permission denied (publickey)`, before the build runs; this source does not change host credentials. The configuration skips production Git builds, and a second guard stops forced production builds before new files can be published. No new Netlify site is created. Remove this temporary configuration after the GitHub Pages cutover. See [Netlify deploy contexts](https://docs.netlify.com/build/configure-builds/file-based-configuration/) and [ignore-build rules](https://docs.netlify.com/build/configure-builds/ignore-builds/).

1. Put this folder at the root of the chosen GitHub repository. Preserve the existing site's repository and Netlify deployment until cutover is complete.
2. Set the repository's Pages source to **GitHub Actions**. Run **Publish website to GitHub Pages**, with indexing disabled, to check the hosted preview. The workflow reads the configured Pages address and uses its correct origin and project path.
3. After design approval, verify the custom domain in GitHub, set the Pages custom domain to `www.dantongli.com`, and update only the website records in Route 53 using GitHub's current domain instructions. Preserve email and other DNS records. Check the apex redirect, `www`, HTTPS, old PRL links and citations before removing the old host.
4. Run the workflow again with indexing enabled. Keep the prior DNS values for rollback. Automatic publishing on each push can be enabled after this first cutover.

The workflow uses the repository's `GITHUB_TOKEN`; no AWS credentials or personal access token belong in this source. GitHub may require one-time Pages or domain settings in the account. The workflows are prepared for GitHub Pages; a local check does not claim that a hosted workflow or deployment has run.

Official setup references: [custom GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Pages metadata action](https://github.com/actions/configure-pages), [Node setup action](https://github.com/actions/setup-node).
