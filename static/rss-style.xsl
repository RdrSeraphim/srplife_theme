<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  exclude-result-prefixes="atom dc content">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/rss/channel/title" /> — RSS Feed</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&amp;display=swap" rel="stylesheet" />
        <style>
          /* === CDE / Solaris Theme — Inline for XSL === */

          :root {
            --cde-bg: #AEB2C3;
            --cde-title-active: #A64872;
            --cde-title-text: #FFFFFF;
            --cde-text: #000000;
            --cde-text-muted: #444444;
            --cde-white: #FFFFFF;
            --cde-light: #D6D8E0;
            --cde-dark: #646875;
            --cde-darker: #404040;
            --font-sans: 'Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', sans-serif;
            --font-serif: 'Source Serif 4', 'Lora', 'Times New Roman', serif;
          }

          html {
            box-sizing: border-box;
            font-size: 16px;
            color: var(--cde-text);
            font-family: var(--font-serif);
            background-image: url("/images/background_purple.svg");
          }

          *, *:before, *:after { box-sizing: inherit; }

          body {
            margin: 0;
            padding: 40px;
            min-height: 100vh;
          }

          a {
            color: var(--cde-title-active);
            text-decoration: none;
            font-weight: bold;
          }
          a:hover { text-decoration: underline; }

          .container {
            max-width: 800px;
            margin: 0 auto;
          }

          /* CDE Window */
          .cde-window {
            background-color: var(--cde-bg);
            margin-bottom: 30px;
            display: flex;
            flex-direction: column;
            box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.2);
            position: relative;
            border: 7px solid var(--cde-title-active);
            padding: 0;
          }

          /* Resize Handles */
          .cde-resize-handle {
            position: absolute;
            width: 40px;
            height: 40px;
            background: transparent;
            z-index: 20;
            pointer-events: none;
            filter: drop-shadow(1px 2px 0 var(--cde-darker));
          }
          .cde-resize-handle::before,
          .cde-resize-handle::after {
            content: "";
            position: absolute;
            background-color: var(--cde-title-active);
          }
          .cde-resize-handle-tl { top: -7px; left: -7px; }
          .cde-resize-handle-tl::before { width: 40px; height: 6px; top: 0; left: 0; }
          .cde-resize-handle-tl::after  { width: 6px; height: 40px; top: 0; left: 0; }
          .cde-resize-handle-tr { top: -7px; right: -7px; }
          .cde-resize-handle-tr::before { width: 40px; height: 6px; top: 0; right: 0; }
          .cde-resize-handle-tr::after  { width: 6px; height: 40px; top: 0; right: 0; }
          .cde-resize-handle-bl { bottom: -7px; left: -7px; }
          .cde-resize-handle-bl::before { width: 28px; height: 6px; bottom: 0; left: 0; }
          .cde-resize-handle-bl::after  { width: 6px; height: 28px; bottom: 0; left: 0; }
          .cde-resize-handle-br { bottom: -7px; right: -7px; }
          .cde-resize-handle-br::before { width: 28px; height: 6px; bottom: 0; right: 0; }
          .cde-resize-handle-br::after  { width: 6px; height: 28px; bottom: 0; right: 0; }

          /* Bezels */
          .cde-bezel {
            position: absolute;
            background-color: var(--cde-title-active);
            z-index: 25;
            pointer-events: none;
            filter: drop-shadow(1px 2px 0 var(--cde-darker));
          }
          .cde-bezel-top    { top: -7px;    left: 33px;  right: 33px; height: 6px; border-left: 1px solid var(--cde-darker); border-right: 1px solid var(--cde-darker); }
          .cde-bezel-bottom { bottom: -7px; left: 21px;  right: 21px; height: 6px; border-left: 1px solid var(--cde-darker); border-right: 1px solid var(--cde-darker); }
          .cde-bezel-left   { left: -7px;   top: 21px;   bottom: 21px; width: 6px; border-top: 1px solid var(--cde-darker); border-bottom: 1px solid var(--cde-darker); }
          .cde-bezel-right  { right: -7px;  top: 21px;   bottom: 21px; width: 6px; border-top: 1px solid var(--cde-darker); border-bottom: 1px solid var(--cde-darker); }

          /* Title Bar */
          .cde-title-bar {
            background-color: var(--cde-title-active);
            color: var(--cde-white);
            padding: 4px 8px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            z-index: 10;
            min-height: 30px;
          }
          .cde-title-text {
            flex-grow: 1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 10px;
            font-family: var(--font-serif);
            letter-spacing: 0.5px;
            text-shadow: 1px 1px 0 var(--cde-dark);
          }
          .cde-controls-left,
          .cde-controls-right {
            display: flex;
            gap: 4px;
            align-items: center;
          }
          .cde-btn {
            width: 20px;
            height: 20px;
            background-color: var(--cde-bg);
            border: 1px solid transparent;
            box-shadow: inset 1px 1px 0 var(--cde-white), inset -1px -1px 0 var(--cde-dark);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .cde-btn-menu {
            margin-right: 4px;
            border-right: 1px solid var(--cde-dark);
            box-shadow: inset 1px 1px 0 var(--cde-white), inset -1px -1px 0 var(--cde-dark), 1px 0 0 var(--cde-white);
          }
          .cde-btn-menu::before {
            content: "";
            width: 6px;
            height: 6px;
            background-color: var(--cde-dark);
            box-shadow: 1px 1px 0 var(--cde-white);
          }
          .cde-btn-minimize::before {
            content: "";
            width: 4px;
            height: 4px;
            background-color: var(--cde-dark);
            box-shadow: 1px 1px 0 var(--cde-white);
          }
          .cde-btn-maximize::before {
            content: "";
            width: 12px;
            height: 12px;
            border: 2px solid var(--cde-dark);
            border-right-color: var(--cde-white);
            border-bottom-color: var(--cde-white);
            background: transparent;
          }
          .cde-btn-close {
            margin-left: 4px;
            border-left: 1px solid var(--cde-white);
            box-shadow: inset 1px 1px 0 var(--cde-white), inset -1px -1px 0 var(--cde-dark), -1px 0 0 var(--cde-dark);
          }
          .cde-btn-close::before,
          .cde-btn-close::after {
            content: "";
            position: absolute;
            width: 14px;
            height: 2px;
            background-color: var(--cde-dark);
            transform: rotate(45deg);
          }
          .cde-btn-close::after { transform: rotate(-45deg); }

          /* Window Content */
          .cde-window-content {
            padding: 20px 24px;
            background-color: var(--cde-bg);
            flex-grow: 1;
            border-top: 2px solid var(--cde-dark);
            border-left: 2px solid var(--cde-dark);
            border-right: 2px solid var(--cde-white);
            border-bottom: 2px solid var(--cde-white);
          }

          /* Feed-specific styles */
          .feed-banner {
            background-color: var(--cde-light);
            border: 2px solid var(--cde-dark);
            border-bottom-color: var(--cde-white);
            border-right-color: var(--cde-white);
            padding: 16px 20px;
            margin-bottom: 20px;
            line-height: 1.6;
            font-size: 0.95rem;
          }

          .feed-banner-icon {
            display: inline-block;
            background: #f4900c;
            color: #fff;
            font-weight: bold;
            font-size: 0.75rem;
            padding: 2px 6px;
            border-radius: 3px;
            vertical-align: middle;
            margin-right: 6px;
          }

          .feed-banner code {
            background: var(--cde-bg);
            border: 1px solid var(--cde-dark);
            padding: 1px 5px;
            font-size: 0.85em;
          }

          .feed-item {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px groove var(--cde-white);
          }
          .feed-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }

          .feed-item-title {
            margin: 0 0 6px 0;
            font-size: 1.2rem;
          }
          .feed-item-title a {
            color: var(--cde-text);
          }

          .feed-item-meta {
            font-size: 0.8rem;
            color: var(--cde-text-muted);
            margin-bottom: 8px;
          }

          .feed-item-description {
            line-height: 1.5;
            font-size: 0.95rem;
          }

          .feed-footer {
            text-align: center;
            margin-top: 10px;
            font-size: 0.85rem;
            color: var(--cde-text-muted);
          }

          @media (max-width: 600px) {
            body { padding: 16px; }
            .cde-window-content { padding: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="cde-window">
            <!-- Resize Handles -->
            <div class="cde-resize-handle cde-resize-handle-tl"></div>
            <div class="cde-resize-handle cde-resize-handle-tr"></div>
            <div class="cde-resize-handle cde-resize-handle-bl"></div>
            <div class="cde-resize-handle cde-resize-handle-br"></div>

            <!-- Bezels -->
            <div class="cde-bezel cde-bezel-top"></div>
            <div class="cde-bezel cde-bezel-bottom"></div>
            <div class="cde-bezel cde-bezel-left"></div>
            <div class="cde-bezel cde-bezel-right"></div>

            <!-- Title Bar -->
            <div class="cde-title-bar">
              <div class="cde-controls-left">
                <div class="cde-btn cde-btn-menu"></div>
              </div>
              <div class="cde-title-text">~<xsl:value-of select="/rss/channel/path" /></div>
              <div class="cde-controls-right">
                <div class="cde-btn cde-btn-minimize"></div>
                <div class="cde-btn cde-btn-maximize"></div>
                <div class="cde-btn cde-btn-close"></div>
              </div>
            </div>

            <!-- Content -->
            <div class="cde-window-content">
              <div class="feed-banner">
                <span class="feed-banner-icon">RSS</span>
                <strong>This is a web feed,</strong> also known as an RSS feed.
                <strong>Subscribe</strong> by copying this URL into your feed reader: <code><xsl:value-of select="/rss/channel/atom:link/@href" /></code>
              </div>

              <xsl:for-each select="/rss/channel/item">
                <div class="feed-item">
                  <h2 class="feed-item-title">
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="link" />
                      </xsl:attribute>
                      <xsl:value-of select="title" />
                    </a>
                  </h2>
                  <div class="feed-item-meta">
                    <xsl:value-of select="pubDate" />
                    <xsl:if test="category">
                       · <xsl:value-of select="category" />
                    </xsl:if>
                  </div>
                  <div class="feed-item-description">
                    <xsl:value-of select="description" disable-output-escaping="yes" />
                  </div>
                </div>
              </xsl:for-each>

              <div class="feed-footer">
                <xsl:value-of select="/rss/channel/title" /> ·
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="/rss/channel/link" />
                  </xsl:attribute>
                  Visit the site
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
