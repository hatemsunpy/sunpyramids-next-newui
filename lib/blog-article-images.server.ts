import { parseFragment } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";

/**
 * Server-only optimization for already-sanitized blog article HTML.
 *
 * Maps HTTPS src URLs on approved Sun Pyramids storage-media blog images to
 * the identical CDN mirror object (pure derivation from each current API HTML
 * string; host mapping is deployment configuration, not data), and adds
 * native loading="lazy" to approved-content images after the first two.
 *
 * Applied as string source edits at parse5-reported offsets so untouched HTML
 * bytes stay identical; malformed or unlocatable tag bytes are preserved.
 */

const ORIGINAL_HOST = "sunpyramidtours.com";
const CDN_HOST = "cdn.sunpyramidstours.com";
const PATH_PREFIX = "/storage/media/blogs/";
const MEDIA_PATH_PREFIX = "/storage/media";
const ALLOWED_EXTENSIONS = new Set(["webp", "jpeg", "jpg", "png", "avif"]);
const TINY_PIXEL_LIMIT = 32;
const EAGER_IMAGE_COUNT = 2;
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

interface SourceEdit {
  start: number;
  end: number;
  text: string;
}

type ChildNode = DefaultTreeAdapterTypes.ChildNode;
type Element = DefaultTreeAdapterTypes.Element;

function escapeAttributeValue(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function isAttributeWhitespace(ch: string) {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\f" || ch === "\r";
}

function positiveDimension(raw: string | undefined) {
  if (raw === undefined || !/^[1-9][0-9]*$/.test(raw)) return undefined;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isHtmlImage(node: ChildNode): node is Element {
  const element = node as Element;
  return element.nodeName === "img" && element.namespaceURI === HTML_NAMESPACE;
}

/**
 * Rebuilds the parsed src attribute slice, keeping the original attribute name
 * spelling. Quoted values keep their quote style; unquoted rewritten targets
 * are re-wrapped in double quotes so '=', '&' and spaces stay attribute-safe.
 */
function rewriteSrcAttributeSlice(rawSlice: string, newValue: string): string | null {
  const eqIndex = rawSlice.indexOf("=");
  if (eqIndex === -1) return null;
  let position = eqIndex + 1;
  while (position < rawSlice.length && isAttributeWhitespace(rawSlice[position])) position += 1;
  const quote = rawSlice[position];
  if (quote === '"' || quote === "'") {
    if (rawSlice.indexOf(quote, position + 1) === -1) return null;
    return `${rawSlice.slice(0, position + 1)}${escapeAttributeValue(newValue)}${quote}`;
  }
  return `${rawSlice.slice(0, position)}"${escapeAttributeValue(newValue)}"`;
}

function approvedArticleImageUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== ORIGINAL_HOST ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    !url.pathname.startsWith(PATH_PREFIX)
  ) {
    return null;
  }
  const lastDot = url.pathname.lastIndexOf(".");
  if (lastDot === -1) return null;
  const extension = url.pathname.slice(lastDot + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) return null;
  return url;
}

function cdnMirror(url: URL) {
  return `https://${CDN_HOST}${url.pathname.slice(MEDIA_PATH_PREFIX.length)}${url.search}${url.hash}`;
}

function collectSourceEdits(fragment: DefaultTreeAdapterTypes.DocumentFragment, html: string) {
  const edits: SourceEdit[] = [];
  let htmlImageCount = 0;

  const visit = (childNodes: ChildNode[]) => {
    for (const node of childNodes) {
      if (node.nodeName === "template") continue;

      if (isHtmlImage(node)) {
        htmlImageCount += 1;
        const location = node.sourceCodeLocation;
        const attrLocations = location?.attrs;
        const startTag = location?.startTag;
        if (!attrLocations || !startTag) continue;

        const attributes = new Map<string, string>();
        for (const attr of node.attrs) {
          if (!attributes.has(attr.name)) attributes.set(attr.name, attr.value);
        }
        const width = positiveDimension(attributes.get("width"));
        const height = positiveDimension(attributes.get("height"));
        const isTiny =
          (width !== undefined && width <= TINY_PIXEL_LIMIT) ||
          (height !== undefined && height <= TINY_PIXEL_LIMIT);
        if (isTiny) continue;

        const src = attributes.get("src");
        const srcUrl = src === undefined ? null : approvedArticleImageUrl(src);
        const srcLocation = attrLocations["src"];

        if (
          srcUrl &&
          !attributes.has("srcset") &&
          srcLocation &&
          srcLocation.endOffset > srcLocation.startOffset
        ) {
          const rewritten = cdnMirror(srcUrl);
          const rawSlice = html.slice(srcLocation.startOffset, srcLocation.endOffset);
          const replacement = rewriteSrcAttributeSlice(rawSlice, rewritten);
          if (replacement && replacement !== rawSlice) {
            edits.push({
              start: srcLocation.startOffset,
              end: srcLocation.endOffset,
              text: replacement,
            });
          }
        }

        const fetchPriority = (attributes.get("fetchpriority") ?? "").toLowerCase();
        if (
          htmlImageCount > EAGER_IMAGE_COUNT &&
          srcUrl !== null &&
          width !== undefined &&
          height !== undefined &&
          width > TINY_PIXEL_LIMIT &&
          height > TINY_PIXEL_LIMIT &&
          !attributes.has("loading") &&
          fetchPriority !== "high"
        ) {
          const tagBytes = html.slice(startTag.startOffset, startTag.endOffset);
          if (tagBytes.endsWith(">")) {
            const insertAt = tagBytes.endsWith("/>")
              ? startTag.endOffset - 2
              : startTag.endOffset - 1;
            edits.push({ start: insertAt, end: insertAt, text: ' loading="lazy"' });
          }
        }
      }

      if ("childNodes" in node) visit(node.childNodes);
    }
  };

  visit(fragment.childNodes);
  return edits;
}

export function prepareBlogArticleImages(html: string): string {
  const fragment = parseFragment(html, { sourceCodeLocationInfo: true });
  const edits = collectSourceEdits(fragment, html);
  if (edits.length === 0) return html;

  // Edits never overlap: each src-attribute edit covers only that attribute's
  // bytes, and a lazy insertion sits at that same start tag's own '>' or '/>'
  // boundary, after every attribute range. Descending application keeps the
  // earlier offsets valid while later splices run.
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let result = html;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  return result;
}
