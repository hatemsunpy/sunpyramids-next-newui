export const MAX_COMPARE_TOURS = 3;
const EMPTY_SELECTION: string[] = [];

// Persist user choices only. Tour records are never stored in sessionStorage.
export function createComparisonSelection(scope: string) {
  const key = `sunpyramids:compare:v1:${scope}`;
  let snapshot: string[] | undefined;
  const listeners = new Set<() => void>();

  function read() {
    if (snapshot) return snapshot;
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(key) || "[]");
      snapshot = Array.isArray(stored)
        ? [...new Set(stored.filter((slug): slug is string => typeof slug === "string" && slug.trim().length > 0))].slice(0, MAX_COMPARE_TOURS)
        : [];
    } catch {
      // Corrupt or unavailable browser storage must not block in-memory selection.
      snapshot = [];
    }
    return snapshot;
  }

  function write(slugs: string[]) {
    snapshot = slugs;
    try { sessionStorage.setItem(key, JSON.stringify(slugs)); } catch { /* Private browsing can deny storage. */ }
    listeners.forEach((listener) => listener());
  }

  return {
    read,
    serverSnapshot: () => EMPTY_SELECTION,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    toggle(slug: string) {
      const slugs = read();
      if (slugs.includes(slug)) { write(slugs.filter((selected) => selected !== slug)); return true; }
      if (slugs.length >= MAX_COMPARE_TOURS) return false;
      write([...slugs, slug]);
      return true;
    },
    remove: (slug: string) => write(read().filter((selected) => selected !== slug)),
    clear: () => write([]),
  };
}
