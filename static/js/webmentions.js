/**
 * Webmentions display script
 * Fetches mentions from webmention.io and renders replies + plain mentions.
 * Likes and reposts are deliberately excluded.
 */
(function () {
    "use strict";

    const ENDPOINT = "https://webmention.io/api/mentions.jf2";
    const ALLOWED_TYPES = ["in-reply-to", "mention-of"];
    const PER_PAGE = 30;

    function getTargetURLs() {
        // webmention.io is exact-match on URLs, so query both with and without trailing slash
        const canonical = document.querySelector('link[rel="canonical"]');
        const base = canonical
            ? canonical.href
            : window.location.href.split("#")[0].split("?")[0];
        const withSlash = base.endsWith("/") ? base : base + "/";
        const withoutSlash = base.endsWith("/") ? base.slice(0, -1) : base;
        return [withSlash, withoutSlash];
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function relativeTime(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function renderMention(mention) {
        const author = mention.author || {};
        const authorName = escapeHtml(author.name || "Anonymous");
        const authorUrl = author.url || "#";
        const authorPhoto = author.photo || "";
        const sourceUrl = mention.url || mention["wm-source"] || "#";
        const content = mention.content
            ? mention.content.text || mention.content.html || ""
            : "";
        const snippet =
            content.length > 280 ? content.substring(0, 280) + "…" : content;
        const published = mention.published || mention["wm-received"] || "";

        let photoHtml = "";
        if (authorPhoto) {
            photoHtml = `<img class="wm-author-photo" src="${escapeHtml(authorPhoto)}" alt="${authorName}" width="32" height="32" loading="lazy" />`;
        } else {
            photoHtml = `<div class="wm-author-photo wm-author-photo-fallback" aria-hidden="true"></div>`;
        }

        return `
            <div class="wm-mention">
                <div class="wm-mention-header">
                    <a href="${escapeHtml(authorUrl)}" class="wm-author-link" rel="nofollow noopener" target="_blank">
                        ${photoHtml}
                        <span class="wm-author-name">${authorName}</span>
                    </a>
                    ${published ? `<time class="wm-mention-date" datetime="${escapeHtml(published)}">${relativeTime(published)}</time>` : ""}
                </div>
                ${snippet ? `<p class="wm-mention-content">${escapeHtml(snippet)}</p>` : ""}
                <a class="wm-mention-source" href="${escapeHtml(sourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(sourceUrl)}</a>
            </div>
        `;
    }

    async function fetchMentions(targetUrl) {
        try {
            const url = `${ENDPOINT}?target=${encodeURIComponent(targetUrl)}&per-page=${PER_PAGE}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            return data.children || [];
        } catch (e) {
            return [];
        }
    }

    async function init() {
        const section = document.getElementById("webmentions");
        const list = document.getElementById("webmentions-list");
        if (!section || !list) return;

        const targets = getTargetURLs();
        const allMentions = [];
        const seen = new Set();

        for (const target of targets) {
            const mentions = await fetchMentions(target);
            for (const m of mentions) {
                const id = m["wm-id"];
                if (id && seen.has(id)) continue;
                if (id) seen.add(id);

                const type = m["wm-property"];
                if (ALLOWED_TYPES.includes(type)) {
                    allMentions.push(m);
                }
            }
        }

        if (allMentions.length === 0) return;

        // Sort by date, newest first
        allMentions.sort(function (a, b) {
            const dateA = new Date(a.published || a["wm-received"] || 0);
            const dateB = new Date(b.published || b["wm-received"] || 0);
            return dateB - dateA;
        });

        list.innerHTML = allMentions.map(renderMention).join("");
        section.style.display = "";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
