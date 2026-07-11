# Ghost → Hugo Theme Migration: srplife

Convert the `srplife` CDE/Solaris-inspired Ghost theme to a Hugo theme targeting Hugo v0.163.3 (extended).

## Decisions (Resolved)

| Question | Decision |
|----------|----------|
| Repo structure | **Theme only** — used as `themes/srplife/` in a separate content repo. Includes `exampleSite/` for local dev/testing. |
| Comment system | **Giscus** (GitHub Discussions-backed) — replaces Ghost comments. Configurable via theme params. |
| Profile/h-card data | **Configurable** via `hugo.toml` `[params]`. An `exampleSite/hugo.toml` ships with the current hardcoded values for easy porting. |
| Hardcoded URLs | **Use `{{ .Site.BaseURL }}`** everywhere. |
| Content migration | **Deferred** to a separate task. Ghost content is not pure Markdown (HTML blocks, Ghost cards). Hugo's support for HTML-in-content and alternative content formats needs separate assessment. Phase 6 from the original plan is removed. |
| Sitemap | **Dropped** — Hugo's built-in sitemap is sufficient. Ghost's News sitemap extensions removed. |

---

## Proposed Changes

### Phase 1: Directory Restructuring

Convert from Ghost's flat layout to Hugo theme conventions.

#### Target Hugo Theme Layout
```
srplife_theme/
├── theme.toml                          ← [NEW] theme metadata
├── LICENSE                             ← KEEP
├── README.md                           ← MODIFY (update for Hugo)
├── layouts/
│   ├── _default/
│   │   ├── baseof.html                 ← [NEW] from default.hbs
│   │   ├── single.html                 ← [NEW] from post.hbs
│   │   └── list.html                   ← [NEW] section list (minimal)
│   ├── page/
│   │   └── single.html                 ← [NEW] from page.hbs
│   ├── index.html                      ← [NEW] from index.hbs (home)
│   ├── 404.html                        ← [NEW] from error-404.hbs
│   ├── _default/home.rss.xml           ← [NEW] custom RSS
│   └── partials/
│       ├── head.html                   ← [NEW] <head> content
│       ├── header.html                 ← [NEW] system bar
│       ├── footer.html                 ← [NEW] footer + badges
│       ├── hcard.html                  ← [NEW] IndieWeb h-card
│       ├── cde-window-top.html         ← [NEW] CDE window chrome (open)
│       ├── cde-window-bottom.html      ← [NEW] CDE window chrome (close)
│       ├── pagination.html             ← [NEW] CDE-styled pagination
│       └── giscus.html                 ← [NEW] giscus comments
├── assets/
│   └── css/
│       └── src/                        ← KEEP: PostCSS source (unchanged)
│           ├── main.css
│           ├── settings.css
│           ├── base.css
│           ├── layout.css
│           ├── cde.css
│           └── components/
│               ├── content.css
│               ├── content-cards.css   ← RENAME from ghost.css
│               ├── forms.css
│               ├── posts.css
│               ├── profile.css
│               ├── sidenotes.css
│               ├── system-bar.css
│               └── webmentions.css
├── static/
│   ├── js/
│   │   ├── sidenotes.js               ← MOVE from assets/js/
│   │   ├── post-utils.js              ← MOVE
│   │   ├── system-bar.js              ← MOVE
│   │   ├── webmentions.js             ← MOVE
│   │   └── snowstorm.js               ← MOVE
│   ├── css/
│   │   └── prism.css                  ← MOVE from assets/css/
│   ├── images/                         ← MOVE from assets/images/
│   └── rss-style.xsl                  ← MOVE from assets/
├── exampleSite/
│   ├── hugo.toml                       ← [NEW] example config with all params
│   └── content/
│       ├── _index.md                   ← [NEW] home page
│       └── posts/
│           └── example-post.md         ← [NEW] sample post for testing
├── package.json                        ← MODIFY
├── postcss.config.js                   ← KEEP
└── reference_material/                 ← KEEP (for future content migration)
```

#### Files to DELETE:
- `default.hbs`, `index.hbs`, `post.hbs`, `page.hbs`, `error-404.hbs`, `sitemap.hbs`
- `assets/js/comment-overrides.js` (Ghost-specific)
- `assets/css/screen.css` (generated file, Hugo Pipes replaces this)
- `routes.yaml`, `redirects.yaml` (Ghost routing)
- `dist/` directory (Ghost packaging)
- `preview/` directory (replaced by Hugo's dev server)
- `test-theme.js` (replaced by `hugo server`)

> [!NOTE]
> **`assets/` vs `static/`**: In Hugo themes, `assets/` is for files processed by Hugo Pipes (CSS via PostCSS). `static/` is for files served as-is (JS, images, pre-built CSS). The PostCSS source stays in `assets/` so Hugo Pipes can process it. Everything else moves to `static/`.

---

### Phase 2: Configuration

#### [NEW] theme.toml

Theme metadata file:
```toml
name = "srplife"
license = "MIT"
licenselink = "https://github.com/RdrSeraphim/srplife_theme/blob/main/LICENSE"
description = "A CDE/Solaris-inspired retro theme for Hugo."
homepage = "https://github.com/RdrSeraphim/srplife_theme"
tags = ["retro", "cde", "solaris", "blog", "personal"]
features = ["rss", "webmentions", "indieweb", "giscus"]
min_version = "0.128.0"

[author]
  name = "Seraphim Pardee"
  homepage = "https://srp.life"
```

#### [NEW] exampleSite/hugo.toml

Complete working config with all the currently-hardcoded values:
- `baseURL`, `title`, `languageCode`, `paginate = 6`
- `[params]`: author bio, profile image, site description
- `[params.indieweb]`: full h-card data (name, nicknames, job title, region, country, etc.)
- `[params.giscus]`: repo, repoId, category, categoryId (empty placeholders for user to fill)
- `[[menus.main]]`: Home, About
- `[taxonomies]`: `tag = "tags"`
- `[permalinks]`: `posts = '/:slug/'`
- `[markup.goldmark.renderer]`: `unsafe = true`

---

### Phase 3: Template Conversion (Handlebars → Go Templates)

Core mapping table:

| Ghost (Handlebars)                  | Hugo (Go Template)                                  |
|--------------------------------------|-----------------------------------------------------|
| `{{!< default}}`                     | `{{ define "main" }}...{{ end }}`                    |
| `{{{body}}}`                         | `{{ block "main" . }}{{ end }}`                      |
| `{{@site.title}}`                    | `{{ .Site.Title }}`                                  |
| `{{@site.url}}`                      | `{{ .Site.BaseURL }}`                                |
| `{{@site.locale}}`                   | `{{ site.Language.Locale }}`                         |
| `{{asset "path"}}`                   | `{{ "path" \| relURL }}` (static) or Hugo Pipes      |
| `{{ghost_head}}` / `{{ghost_foot}}`  | Removed → explicit meta/links in `head.html`        |
| `{{navigation}}`                     | `{{ range .Site.Menus.main }}`                       |
| `{{#foreach posts}}`                 | `{{ range .Paginator.Pages }}`                       |
| `{{pagination}}`                     | `{{ partial "pagination.html" . }}`                  |
| `{{#post}}...{{/post}}`              | Direct `.` context                                    |
| `{{title}}`                          | `{{ .Title }}`                                        |
| `{{slug}}`                           | `{{ .Slug }}` or filename                             |
| `{{url}}`                            | `{{ .RelPermalink }}`                                 |
| `{{date format="D MMMM YYYY"}}`     | `{{ .Date.Format "2 January 2006" }}`                |
| `{{excerpt words="30"}}`             | `{{ .Summary }}`                                      |
| `{{content}}`                        | `{{ .Content }}`                                      |
| `{{reading_time}}`                   | `{{ .ReadingTime }}`                                  |
| `{{img_url feature_image}}`          | `{{ .Params.feature_image }}`                         |
| `{{#primary_tag}}`                   | `{{ with (index (.GetTerms "tags") 0) }}`             |
| `{{body_class}}`                     | Hugo page `.Kind`                                     |
| `{{#if @member}}`                    | **REMOVED**                                           |
| `{{comments}}`                       | `{{ partial "giscus.html" . }}`                       |
| `{{date format="YYYY"}}`            | `{{ now.Format "2006" }}`                             |

#### [NEW] layouts/_default/baseof.html
From [default.hbs](file:///home/srp/code/srplife_theme/default.hbs):
- `<head>` → `{{ partial "head.html" . }}`
- h-card → `{{ partial "hcard.html" . }}`
- System bar → `{{ partial "header.html" . }}` (**remove** `@member` auth block entirely)
- `{{{body}}}` → `{{ block "main" . }}{{ end }}`
- Footer → `{{ partial "footer.html" . }}` (change "Ghost" → "Hugo", use `{{ .Site.BaseURL }}`)
- Scripts via `{{ "js/file.js" | relURL }}`
- **Remove** `{{ghost_head}}`, `{{ghost_foot}}`
- **Remove** `comment-overrides.js` script tag

#### [NEW] layouts/index.html
From [index.hbs](file:///home/srp/code/srplife_theme/index.hbs):
- Profile photo: `{{ .Site.Params.profileImage | relURL }}`
- Profile name: `{{ .Site.Title }}`
- Profile bio: `{{ .Site.Params.bio }}`
- Post loop: `{{ range .Paginator.Pages }}`
- Feature image: `{{ with .Params.feature_image }}`
- Primary tag: `{{ with (index (.GetTerms "tags") 0) }}`
- Reading time: `{{ .ReadingTime }}`
- Pagination: `{{ partial "pagination.html" . }}`

#### [NEW] layouts/_default/single.html
From [post.hbs](file:///home/srp/code/srplife_theme/post.hbs):
- Title bar: `~/posts/{{ .File.BaseFileName }}`
- Close button: `{{ .Site.BaseURL | relURL }}`
- Feature image, title, date, tag, reading time via Hugo vars
- h-entry microformat markup preserved
- Author: `{{ .Site.Params.author }}` etc.
- Webmentions section preserved
- Ghost `{{comments}}` → `{{ partial "giscus.html" . }}`

#### [NEW] layouts/page/single.html
From [page.hbs](file:///home/srp/code/srplife_theme/page.hbs):
- Title bar: `~/pages/{{ .File.BaseFileName }}`
- Conditional title/feature image via `{{ with .Params.show_title }}`
- `{{ .Content }}` for body

#### [NEW] layouts/404.html
From [error-404.hbs](file:///home/srp/code/srplife_theme/error-404.hbs):
- ASCII pikachu preserved verbatim
- `{{@site.url}}` → `{{ .Site.BaseURL }}`

#### [NEW] layouts/_default/home.rss.xml
Custom RSS with `<?xml-stylesheet?>` referencing `/rss-style.xsl`.

#### [NEW] Partials

| Partial | Source | Description |
|---------|--------|-------------|
| `head.html` | `default.hbs` `<head>` | Meta, PostCSS pipe, Prism.js, webmention `<link>`s |
| `header.html` | `default.hbs` system bar | Menu loop, clock div — **no auth links** |
| `footer.html` | `default.hbs` footer | Copyright (Hugo credit), 88x31 badges, IndieWeb webring |
| `hcard.html` | `default.hbs` h-card div | Full IndieWeb h-card, data from `[params.indieweb]` |
| `cde-window-top.html` | Extracted pattern | Reusable: resize handles + bezels + title bar (accepts title param) |
| `cde-window-bottom.html` | Extracted pattern | Closing `</div>`s for window content + window |
| `pagination.html` | New | CDE-styled prev/next with `.Paginator` |
| `giscus.html` | New | Giscus `<script>` tag, configurable via `[params.giscus]` |

---

### Phase 4: CSS Pipeline Migration

#### [KEEP] assets/css/src/ — all PostCSS source files unchanged

Hugo Pipes handles PostCSS at build time. In `partials/head.html`:
```go-html-template
{{ with resources.Get "css/src/main.css" }}
  {{ if hugo.IsDevelopment }}
    {{ with . | postCSS }}
      <link rel="stylesheet" href="{{ .RelPermalink }}">
    {{ end }}
  {{ else }}
    {{ with . | postCSS | minify | fingerprint }}
      <link rel="stylesheet" href="{{ .RelPermalink }}" integrity="{{ .Data.Integrity }}">
    {{ end }}
  {{ end }}
{{ end }}
```

#### [RENAME] ghost.css → content-cards.css
- Remove `#ghost-comments-root` styles (lines 347-356)
- Update import path in `main.css`

---

### Phase 5: JavaScript & Static Assets

#### Move to `static/js/` (no changes to file contents):
- `sidenotes.js`, `post-utils.js`, `system-bar.js`, `webmentions.js`, `snowstorm.js`

#### Delete:
- `comment-overrides.js` (Ghost iframe override, useless without Ghost)

#### Move to `static/`:
- `assets/images/` → `static/images/`
- `assets/css/prism.css` → `static/css/prism.css`
- `assets/rss-style.xsl` → `static/rss-style.xsl`

---

### Phase 6: Test Infrastructure & Cleanup

#### [NEW] exampleSite/ — for local dev/testing

Contains sample content and full config. Test with:
```bash
cd exampleSite && hugo server --themesDir ../.. --port 8787
```

#### [MODIFY] package.json
- Remove `ghost` engine, `zip` script, `build:css`/`dev:css` scripts
- Remove `handlebars`, `fs-extra` dependencies
- Keep PostCSS devDependencies (Hugo Pipes needs them installed via npm)
- Add Hugo-oriented scripts:
  ```json
  "scripts": {
    "dev": "cd exampleSite && hugo server --themesDir ../.. --port 8787 --buildDrafts",
    "build": "cd exampleSite && hugo --themesDir ../.. --minify"
  }
  ```

#### [DELETE] Files:
- `default.hbs`, `index.hbs`, `post.hbs`, `page.hbs`, `error-404.hbs`, `sitemap.hbs`
- `routes.yaml`, `redirects.yaml`
- `dist/srplife.zip`
- `preview/` (entire directory)
- `test-theme.js`
- `assets/css/screen.css`
- `assets/js/comment-overrides.js`

---

## Verification Plan

### Automated
```bash
# Full build — catches template errors, broken references
cd exampleSite && hugo --themesDir ../.. --minify

# Dev server for visual inspection
cd exampleSite && hugo server --themesDir ../.. --port 8787 --buildDrafts
```

### Manual Checklist
- [ ] Home page: profile sidebar + paginated post list
- [ ] CDE window chrome renders correctly (title bars, bezels, resize handles)
- [ ] Single post: feature image, title, date, tag, reading time, content
- [ ] Single page: conditional title/image, content
- [ ] 404: ASCII pikachu terminal
- [ ] System bar: nav menu + clock, **no** auth links
- [ ] RSS feed: XSL stylesheet renders
- [ ] Pagination works
- [ ] Sidenotes/footnotes render
- [ ] Webmentions section present on posts
- [ ] Header anchors (¶) work
- [ ] Mobile responsive: menu toggle
- [ ] h-card, h-entry, h-feed microformats intact
- [ ] 88x31 badges load in footer
- [ ] Giscus comment widget loads on posts
- [ ] PostCSS processes correctly (dev + production)

## Execution Order

| Phase | Description | Depends On |
|-------|-------------|------------|
| 1 | Directory restructuring (mkdir, mv, rm) | — |
| 2 | Configuration (`theme.toml`, `exampleSite/hugo.toml`) | Phase 1 |
| 3 | Template conversion (all layouts + partials) | Phase 1, 2 |
| 4 | CSS pipeline migration (rename, update imports) | Phase 1, 3 |
| 5 | JS & static asset moves | Phase 1 |
| 6 | Test infrastructure, cleanup, verify | All |
