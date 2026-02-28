/**
 * Ghost Comments Text Overrides
 *
 * Overrides specific strings in Ghost's built-in comments UI (which renders
 * inside an iframe). Uses a MutationObserver to detect when the iframe loads,
 * then walks the DOM inside it to find and replace target strings.
 */
(function () {
    // Map of original text -> replacement text
    const overrides = {
        "Become a member of": "Become a free member of",
    };

    function applyOverrides(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            for (const [original, replacement] of Object.entries(overrides)) {
                if (node.textContent.includes(original)) {
                    node.textContent = node.textContent.replace(original, replacement);
                }
            }
        }
    }

    function processIframe(iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            applyOverrides(iframeDoc.body);

            // Watch for dynamic content changes within the iframe
            const observer = new MutationObserver(() => applyOverrides(iframeDoc.body));
            observer.observe(iframeDoc.body, { childList: true, subtree: true, characterData: true });
        } catch (e) {
            // Cross-origin iframe, can't access
        }
    }

    function watchForCommentsIframe() {
        const observer = new MutationObserver(() => {
            const iframes = document.querySelectorAll('iframe[data-cynoia], iframe[title="comments-frame"], .gh-comments-container iframe, .comments-section iframe');
            iframes.forEach((iframe) => {
                if (iframe.dataset.overridesApplied) return;
                iframe.dataset.overridesApplied = "true";
                iframe.addEventListener("load", () => processIframe(iframe));
                // Also try immediately in case it already loaded
                if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
                    processIframe(iframe);
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", watchForCommentsIframe);
    } else {
        watchForCommentsIframe();
    }
})();
