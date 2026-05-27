const fs = require("fs-extra");
const Handlebars = require("handlebars");
const path = require("path");
const http = require("http");
const cp = require("child_process");

// Configuration
const EXPORT_FILE = "reference_material/ghost-export.json";
const OUTPUT_DIR = "preview";

// Helpers to mock Ghost functionality
Handlebars.registerHelper("asset", function (assetPath) {
    // If we are in a subdirectory (post), we need to go up one level
    const prefix = this.rootPath || "";
    return `${prefix}assets/${assetPath}`;
});

Handlebars.registerHelper("date", function (date, options) {
    // If date is not passed, it might be in options (as the first arg) or we use this.published_at
    let dateValue = date;

    // If the first argument is the options object (meaning no date arg was passed)
    if (date && date.hash) {
        options = date;
        dateValue = this.published_at || this.created_at;
    }

    if (!dateValue) return "";

    // Simple formatting - ignores the format string for now, just makes it readable
    return new Date(dateValue).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
});

Handlebars.registerHelper("img_url", function (image, options) {
    return image || "";
});

Handlebars.registerHelper("excerpt", function (options) {
    // Strip HTML tags for excerpt
    const text = this.html ? this.html.replace(/<[^>]*>?/gm, "") : "";
    return new Handlebars.SafeString(text.substring(0, 150) + "...");
});

Handlebars.registerHelper("url", function (options) {
    const prefix = this.rootPath || "";
    const slug = this.slug;
    return `${prefix}${slug}/index.html`;
});

Handlebars.registerHelper("navigation", function (options) {
    const prefix = this.rootPath || "";
    // Mock navigation - making sure links work relative to current page
    return new Handlebars.SafeString(`
        <li><a href="${prefix}index.html">Home</a></li>
        <li><a href="${prefix}about/index.html">About</a></li>
    `);
});

Handlebars.registerHelper("pagination", function (options) {
    return new Handlebars.SafeString('<nav class="pagination"><span>Page 1 of 1</span></nav>');
});

Handlebars.registerHelper("body_class", function () {
    return "home-template";
});

Handlebars.registerHelper("ghost_head", function () {
    return "<!-- ghost_head -->";
});

Handlebars.registerHelper("ghost_foot", function () {
    return "<!-- ghost_foot -->";
});

Handlebars.registerHelper("foreach", function (context, options) {
    let ret = "";
    if (context && context.length > 0) {
        for (let i = 0, j = context.length; i < j; i++) {
            // Inherit rootPath from parent context
            const itemContext = { ...context[i], rootPath: this.rootPath };
            ret = ret + options.fn(itemContext);
        }
    }
    return ret;
});

Handlebars.registerHelper("content", function (options) {
    return new Handlebars.SafeString(this.html || "");
});

Handlebars.registerHelper("match", function (arg1, arg2, options) {
    // Simple implementation for {{#match value}}
    // If 2 args (value, options), it's a truthy check
    if (arguments.length === 2) {
        options = arg2;
        return arg1 ? options.fn(this) : options.inverse(this);
    }
    // If 4 args (val1, op, val2, options), handle equality
    if (arguments.length === 4) {
        options = arguments[3];
        const operator = arg2;
        const val2 = arguments[2];
        if (operator === "=") {
            return arg1 == val2 ? options.fn(this) : options.inverse(this);
        }
    }
    return options.inverse(this);
});

// ... (rest of code)

// Main execution
async function build() {
    try {
        // 1. Load Data
        console.log("Loading data...");
        const exportData = await fs.readJson(EXPORT_FILE);
        const db = exportData.db[0].data;
        let allPosts = db.posts;

        // Filter out "Daily Orthodox" posts
        allPosts = allPosts.filter((p) => !p.title.startsWith("Daily Orthodox"));

        // Separate Pages and Posts
        const posts = allPosts.filter((p) => p.type === "post" && p.status === "published");
        const pages = allPosts.filter((p) => p.type === "page" && p.status === "published");

        // Mock @site global
        const site = {
            title: "Rdr. Seraphim Pardee",
            description: "The musings of an Orthodox Christian reader and software engineer.",
            url: "https://srp.life",
            icon: "",
        };

        // 2. Prepare Output Directory
        await fs.emptyDir(OUTPUT_DIR);
        await fs.ensureDir(OUTPUT_DIR);
        await fs.copy("assets", path.join(OUTPUT_DIR, "assets"));
        console.log("Copied assets...");

        // 3. Load Templates
        const defaultSource = await fs.readFile("default.hbs", "utf8");
        const indexSource = await fs.readFile("index.hbs", "utf8");
        const postSource = await fs.readFile("post.hbs", "utf8");
        const pageSource = await fs.readFile("page.hbs", "utf8");
        const fourOhFourSource = await fs.readFile("error-404.hbs", "utf8");

        // Compile Helper
        const compileWithLayout = (templateSource, context) => {
            const hasLayout = templateSource.includes("{{!< default}}");
            let content = templateSource;
            if (hasLayout) {
                content = content.replace("{{!< default}}", "");
            }

            const template = Handlebars.compile(content);

            // Prepare data object for @ variables
            const data = {
                site: context["@site"],
                page: context["@page"],
            };

            const body = template(context, { data });

            if (hasLayout) {
                const layoutTemplate = Handlebars.compile(defaultSource);
                return layoutTemplate({ ...context, body: body }, { data });
            }
            return body;
        };

        // 4. Render Index
        console.log(`Rendering index with ${posts.length} posts...`);
        const indexHtml = compileWithLayout(indexSource, {
            posts: posts,
            "@site": site,
            body_class: "home-template",
            rootPath: "./", // Root level
        });
        await fs.writeFile(path.join(OUTPUT_DIR, "index.html"), indexHtml);

        // 5. Render Posts
        console.log("Rendering posts...");
        for (const post of posts) {
            const postHtml = compileWithLayout(postSource, {
                post: post,
                "@site": site,
                body_class: "post-template",
                rootPath: "../", // One level deep
            });
            const slug = post.slug;
            await fs.ensureDir(path.join(OUTPUT_DIR, slug));
            await fs.writeFile(path.join(OUTPUT_DIR, slug, "index.html"), postHtml);
        }

        // 6. Render Pages
        for (const page of pages) {
            const pageHtml = compileWithLayout(pageSource, {
                post: page,
                "@page": page, // Pass page as @page for {{#match @page...}}
                "@site": site,
                body_class: "page-template",
                rootPath: "../", // One level deep
            });
            const slug = page.slug;
            await fs.ensureDir(path.join(OUTPUT_DIR, slug));
            await fs.writeFile(path.join(OUTPUT_DIR, slug, "index.html"), pageHtml);
        }

        // 7. Render RSS Feed Preview
        console.log("Rendering RSS feed preview...");
        const rssItems = posts
            .slice(0, 15)
            .map((post) => {
                // Strip HTML for description
                const plainText = (post.html || "").replace(/<[^>]*>?/gm, "");
                const description = plainText.substring(0, 300) + (plainText.length > 300 ? "..." : "");
                const pubDate = new Date(post.published_at || post.created_at).toUTCString();
                // Escape XML special characters
                const escXml = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
                return `    <item>
      <title>${escXml(post.title)}</title>
      <link>${site.url}/${post.slug}/</link>
      <guid isPermaLink="false">${post.id}</guid>
      <category>${escXml(post.primary_tag || "Uncategorized")}</category>
      <dc:creator>${escXml(site.title)}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <description>${escXml(description)}</description>
    </item>`;
            })
            .join("\n");

        const rssXml = `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="assets/rss-style.xsl"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${site.title}</title>
    <description>${site.description}</description>
    <link>${site.url}</link>
    <generator>Ghost (Preview)</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/rss/" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

        await fs.writeFile(path.join(OUTPUT_DIR, "rss.xml"), rssXml);

        // 8. Render 404 Page
        const fourOhFourHtml = compileWithLayout(fourOhFourSource, {
            "@site": site,
            body_class: "error-template",
            rootPath: "./",
        });
        await fs.writeFile(path.join(OUTPUT_DIR, "404.html"), fourOhFourHtml);

        console.log("Build complete!");
    } catch (err) {
        console.error("Error:", err);
    }

    await serve();
}

async function serve() {
    const server = http.createServer((req, res) => {
        if (req.url === "/") req.url = "/index.html";
        if (req.url === "/404") req.url = "/404.html";

        const filePath = path.join(OUTPUT_DIR, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end("File not found");
            } else {
                if (req.url.endsWith(".svg")) {
                    res.writeHead(200, { "Content-Type": "image/svg+xml" });
                } else if (req.url.endsWith(".css")) {
                    res.writeHead(200, { "Content-Type": "text/css" });
                } else if (req.url.endsWith(".xsl")) {
                    res.writeHead(200, { "Content-Type": "text/xsl" });
                } else if (req.url.endsWith(".xml")) {
                    res.writeHead(200, { "Content-Type": "text/xml" });
                } else if (req.url.endsWith(".json")) {
                    res.writeHead(200, { "Content-Type": "application/json" });
                } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                }
                res.end(data);
            }
        });
    });
    server.listen(8787, () => {
        console.log("Server running at http://localhost:8787/");
        cp.execSync("xdg-open http://localhost:8787/");
    });
}

build();
