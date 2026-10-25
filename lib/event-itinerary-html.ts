import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";

type Node = DefaultTreeAdapterTypes.ChildNode;
type Removal = { start: number; end: number; replacement: string };

function isSeparator(node: Node) {
  return "value" in node && /^[_\-─━–—.·]{8,}$/.test(node.value.replace(/\s/g, ""));
}

function isSpacing(node: Node) {
  return node.nodeName === "br" || ("value" in node && /^\s*$/.test(node.value)) || isSeparator(node);
}

// Remove display-only separators from current API HTML without reserializing
// unrelated markup, attributes, links or prose.
export function removeItinerarySeparators(html: string): string {
  const fragment = parseFragment(html, { sourceCodeLocationInfo: true });
  const removals: Removal[] = [];

  function visit(children: Node[], inItinerary: boolean) {
    children.forEach((node, index) => {
      const isItinerary = inItinerary || (node.nodeName === "table" && "attrs" in node &&
        node.attrs.some((attribute) => attribute.name === "data-sheets-root"));

      if (isItinerary && isSeparator(node)) {
        let first = index;
        let last = index;
        while (first > 0 && isSpacing(children[first - 1])) first--;
        while (last + 1 < children.length && isSpacing(children[last + 1])) last++;
        const start = children[first].sourceCodeLocation?.startOffset;
        const end = children[last].sourceCodeLocation?.endOffset;
        if (start !== undefined && end !== undefined) {
          removals.push({ start, end, replacement: first > 0 && last + 1 < children.length ? "<br>" : "" });
        }
      }

      if ("childNodes" in node) visit(node.childNodes, isItinerary);
    });
  }

  visit(fragment.childNodes, false);
  const merged: Removal[] = [];
  for (const removal of removals.sort((a, b) => a.start - b.start)) {
    const previous = merged[merged.length - 1];
    if (previous && removal.start <= previous.end) previous.end = Math.max(previous.end, removal.end);
    else merged.push({ ...removal });
  }

  let formatted = html;
  for (const { start, end, replacement } of merged.reverse()) {
    formatted = formatted.slice(0, start) + replacement + formatted.slice(end);
  }
  return formatted;
}
