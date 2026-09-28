<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                exclude-result-prefixes="sitemap image xhtml">
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
    <xsl:strip-space elements="*"/>
    <xsl:template name="format-date">
        <xsl:param name="value"/>
        <xsl:choose>
            <xsl:when test="string-length(normalize-space($value)) &gt;= 10">
                <xsl:value-of select="substring($value, 1, 10)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$value"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="/">
        <html lang="en">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>
                <xsl:choose>
                    <xsl:when test="/sitemap:sitemapindex">Sitemap Index</xsl:when>
                    <xsl:otherwise>URL Sitemap</xsl:otherwise>
                </xsl:choose>
            </title>
            <style>
                :root {
                    --navy: #1A3A3A;
                    --navy-2: #0F2929;
                    --navy-3: #2D5252;
                    --bg: #F5F3EE;
                    --sheet: #FFFFFF;
                    --sheet-soft: #FAF8F3;
                    --grid: #E5E2DB;
                    --grid-strong: #D7D1C7;
                    --text: #1A3A3A;
                    --muted: #6F8084;
                    --faint: #9AA8AB;
                    --accent: #D9E7E5;
                    --pill: #EDF3F2;
                    --shadow-xl: 0 20px 50px rgba(17, 61, 72, 0.08);
                    --shadow-sm: 0 4px 18px rgba(17, 61, 72, 0.05);
                    --radius-lg: 24px;
                    --radius-md: 16px;
                    --radius-sm: 10px;
                    --container: 1380px;
                    --transition: 220ms cubic-bezier(0.22, 1, 0.36, 1);
                }

                * { box-sizing: border-box; }

                html {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }

                body {
                    margin: 0;
                    color: var(--text);
                    background:
                        radial-gradient(circle at top left, rgba(17, 61, 72, 0.06), transparent 28%),
                        linear-gradient(180deg, #FBFAF7 0%, var(--bg) 100%);
                    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                a { color: inherit; text-decoration: none; transition: all var(--transition); }
                img { display: block; max-width: 100%; }

                .app { min-height: 100vh; padding: 20px; }
                .workspace { width: min(var(--container), 100%); margin: 0 auto; }

                .topbar {
                    position: sticky; top: 12px; z-index: 60;
                    display: grid; grid-template-columns: auto 1fr auto;
                    align-items: center; gap: 16px;
                    padding: 14px 18px;
                    border: 1px solid rgba(17, 61, 72, 0.08);
                    border-radius: 20px;
                    background: rgba(255,255,255,0.82);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    box-shadow: var(--shadow-sm);
                    margin-bottom: 18px;
                }

                .brand { display: inline-flex; align-items: center; gap: 14px; min-width: 0; }
                .brand-logo-wrap { width: 42px; height: 42px; border-radius: 12px; background: #fff; border: 1px solid var(--grid); display: grid; place-items: center; overflow: hidden; flex: 0 0 42px; }
                .brand-logo { width: 28px; height: 28px; object-fit: contain; }
                .brand-copy { display: grid; gap: 2px; }
                .brand-label { color: var(--faint); font-size: 10px; line-height: 1; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; }
                .brand-title { color: var(--text); font-size: 16px; line-height: 1.2; font-weight: 700; }
                .topbar-center { min-width: 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

                .sheet-pill {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 9px 12px; border-radius: 999px;
                    background: var(--pill); border: 1px solid var(--grid);
                    color: var(--navy); font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
                }
                .sheet-pill:before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--navy); }

                .topbar-link {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 10px 14px; border-radius: 12px;
                    border: 1px solid var(--grid); background: #fff;
                    color: var(--navy); font-size: 12px; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .topbar-link:hover { background: var(--sheet-soft); transform: translateY(-1px); }

                .sheet-frame {
                    border: 1px solid rgba(17, 61, 72, 0.08);
                    border-radius: 26px; overflow: hidden;
                    background: rgba(255,255,255,0.76);
                    box-shadow: var(--shadow-xl);
                }

                .sheet-toolbar {
                    display: grid; grid-template-columns: minmax(0, 1fr) auto;
                    gap: 16px; align-items: center;
                    padding: 18px 22px;
                    border-bottom: 1px solid var(--grid);
                    background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(250,248,243,0.92));
                }
                .sheet-toolbar-main { display: grid; gap: 10px; min-width: 0; }
                .sheet-path { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 8px; color: var(--faint); font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; }
                .sheet-path .sep { color: #C8C2B7; }
                .sheet-title-row { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
                .sheet-title { margin: 0; color: var(--text); font-size: 26px; line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; }
                .sheet-subtitle { color: var(--muted); font-size: 13px; line-height: 1.6; }
                .meta-group { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
                .meta-chip { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 12px; background: #fff; border: 1px solid var(--grid); color: var(--navy); font-size: 12px; font-weight: 700; }
                .meta-chip .key { color: var(--faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
                .meta-chip .value { color: var(--navy); }

                .sheet-grid { overflow-x: auto; background: linear-gradient(180deg, rgba(255,255,255,0.80), rgba(255,255,255,0.92)); }

                table { width: 100%; min-width: 980px; border-collapse: separate; border-spacing: 0; }
                thead th { position: sticky; top: 0; z-index: 3; text-align: left; padding: 14px 16px; background: rgba(244, 240, 233, 0.96); color: var(--navy); border-bottom: 1px solid var(--grid-strong); border-right: 1px solid var(--grid); font-size: 11px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; white-space: nowrap; }
                thead th:last-child { border-right: 0; }
                tbody td { padding: 14px 16px; border-bottom: 1px solid var(--grid); border-right: 1px solid var(--grid); background: rgba(255,255,255,0.72); color: var(--muted); font-size: 13px; line-height: 1.55; vertical-align: middle; }
                tbody td:last-child { border-right: 0; }
                tbody tr:nth-child(even) td { background: rgba(250,248,243,0.78); }
                tbody tr:hover td { background: #F3F8F7; }

                .cell-index { width: 74px; color: var(--faint); font-weight: 700; text-align: right; background: linear-gradient(180deg, rgba(244,240,233,0.92), rgba(250,248,243,0.92)); }
                thead .cell-index { background: rgba(235, 230, 220, 0.98); }
                .cell-url { min-width: 460px; }
                .url-link { display: inline-block; color: var(--navy); font-size: 13px; font-weight: 600; line-height: 1.6; word-break: break-word; }
                .url-link:hover { color: var(--navy-2); }
                .cell-date, .cell-priority, .cell-count { white-space: nowrap; }
                .cell-date { color: var(--navy-3); font-variant-numeric: tabular-nums; }

                .priority-badge, .count-badge {
                    display: inline-flex; align-items: center; justify-content: center;
                    min-height: 30px; padding: 0 10px; border-radius: 999px;
                    font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
                    text-transform: uppercase; border: 1px solid transparent;
                }
                .priority-badge { min-width: 72px; background: #E9F1F0; border-color: #D7E6E3; color: var(--navy); }
                .count-badge { min-width: 76px; background: #F4F1EA; border-color: #E5DED2; color: var(--navy); }

                .open-link { display: inline-flex; align-items: center; gap: 8px; color: var(--navy); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
                .open-link:after { content: "→"; }

                .sheet-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-top: 1px solid var(--grid); background: rgba(250,248,243,0.92); color: var(--muted); font-size: 12px; }
                .footer-left, .footer-right { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; }

                @media (max-width: 900px) { .topbar { grid-template-columns: 1fr; align-items: stretch; } .sheet-toolbar { grid-template-columns: 1fr; } .meta-group { justify-content: flex-start; } }
                @media (max-width: 767px) { .app { padding: 12px; } .topbar { top: 8px; padding: 12px; border-radius: 16px; } .sheet-frame { border-radius: 18px; } .sheet-toolbar { padding: 14px; } .sheet-title { font-size: 22px; } table { min-width: 760px; } thead th, tbody td { padding: 12px; } }

                .hreflang-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                .hreflang-tag {
                    display: inline-block;
                    padding: 2px 7px;
                    border-radius: 5px;
                    background: #E9F1F0;
                    color: var(--navy);
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }
            </style>
        </head>
        <body>
        <div class="app">
            <div class="workspace">
                <div class="topbar">
                    <div class="brand">
                        <div class="brand-logo-wrap">
                            <img class="brand-logo" src="https://sunpyramidstours.com/_ipx/_/images/logo.png" alt="Sun Pyramids Tours"/>
                        </div>
                        <div class="brand-copy">
                            <div class="brand-label">XML Sitemap</div>
                            <div class="brand-title">Sun Pyramids Tours</div>
                        </div>
                    </div>
                    <div class="topbar-center"></div>
                    <xsl:choose>
                        <xsl:when test="/sitemap:sitemapindex">
                            <a href="sitemap.xml" class="topbar-link">Sitemap Index</a>
                        </xsl:when>
                        <xsl:otherwise>
                            <a href="sitemap.xml" class="topbar-link">Sitemap Index</a>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>
                <div class="sheet-frame">
                    <div class="sheet-toolbar">
                        <div class="sheet-toolbar-main">
                            <div class="sheet-path">
                                <span>Workspace</span>
                                <span class="sep">/</span>
                                <span>Sitemaps</span>
                                <span class="sep">/</span>
                                <span>Grid</span>
                            </div>
                            <div class="sheet-title-row">
                                <h1 class="sheet-title">
                                    <xsl:choose>
                                        <xsl:when test="/sitemap:sitemapindex">Sitemap Index</xsl:when>
                                        <xsl:otherwise>URL Sitemap</xsl:otherwise>
                                    </xsl:choose>
                                </h1>
                            </div>
                            <div class="sheet-subtitle">
                                <xsl:choose>
                                    <xsl:when test="/sitemap:sitemapindex">Sitemap index pointing to sub-sitemaps.</xsl:when>
                                    <xsl:otherwise>Spreadsheet-style registry of canonical URLs, last modification dates, and language alternates.</xsl:otherwise>
                                </xsl:choose>
                            </div>
                        </div>
                        <div class="meta-group">
                            <xsl:choose>
                                <xsl:when test="/sitemap:sitemapindex">
                                    <div class="meta-chip">
                                        <span class="key">Sub-Sitemaps</span>
                                        <span class="value"><xsl:value-of select="count(/sitemap:sitemapindex/sitemap:sitemap)"/></span>
                                    </div>
                                </xsl:when>
                                <xsl:otherwise>
                                    <div class="meta-chip">
                                        <span class="key">Rows</span>
                                        <span class="value"><xsl:value-of select="count(/sitemap:urlset/sitemap:url)"/></span>
                                    </div>
                                </xsl:otherwise>
                            </xsl:choose>
                            <div class="meta-chip">
                                <span class="key">Mode</span>
                                <span class="value">XML</span>
                            </div>
                        </div>
                    </div>
                    <div class="sheet-grid">
                        <xsl:choose>
                            <xsl:when test="/sitemap:sitemapindex">
                                <table>
                                    <thead>
                                    <tr>
                                        <th class="cell-index">#</th>
                                        <th>Sitemap</th>
                                        <th>Last Modified</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <xsl:for-each select="/sitemap:sitemapindex/sitemap:sitemap">
                                        <tr>
                                            <td class="cell-index"><xsl:value-of select="position()"/></td>
                                            <td class="cell-url">
                                                <a class="url-link" href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                                            </td>
                                            <td class="cell-date">
                                                <xsl:call-template name="format-date">
                                                    <xsl:with-param name="value" select="sitemap:lastmod"/>
                                                </xsl:call-template>
                                            </td>
                                        </tr>
                                    </xsl:for-each>
                                    </tbody>
                                </table>
                            </xsl:when>
                            <xsl:otherwise>
                                <table>
                                    <thead>
                                    <tr>
                                        <th class="cell-index">#</th>
                                        <th>URL</th>
                                        <th>Last Modified</th>
                                        <th>Alternates</th>
                                        <th>Image</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <xsl:for-each select="/sitemap:urlset/sitemap:url">
                                        <tr>
                                            <td class="cell-index"><xsl:value-of select="position()"/></td>
                                            <td class="cell-url">
                                                <a class="url-link" href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                                            </td>
                                            <td class="cell-date">
                                                <xsl:choose>
                                                    <xsl:when test="normalize-space(sitemap:lastmod) != ''">
                                                        <xsl:call-template name="format-date">
                                                            <xsl:with-param name="value" select="sitemap:lastmod"/>
                                                        </xsl:call-template>
                                                    </xsl:when>
                                                    <xsl:otherwise>—</xsl:otherwise>
                                                </xsl:choose>
                                            </td>
                                            <td class="cell-count">
                                                <span class="count-badge">
                                                    <xsl:value-of select="count(xhtml:link)"/>
                                                </span>
                                            </td>
                                            <td class="cell-count">
                                                <span class="count-badge">
                                                    <xsl:value-of select="count(image:image)"/>
                                                </span>
                                            </td>
                                        </tr>
                                    </xsl:for-each>
                                    </tbody>
                                </table>
                            </xsl:otherwise>
                        </xsl:choose>
                    </div>
                    <div class="sheet-footer">
                        <div class="footer-left"></div>
                        <div class="footer-right">
                            <div>Grid sheet active</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </body>
        </html>
    </xsl:template>
</xsl:stylesheet>