---
name: Sun Pyramids Tours
description: Expert-led Egypt tour booking — established operator clarity with destination imagery.
colors:
  primary: "#163a96"
  secondary: "#f7951d"
  neutral-bg: "#eeeeee"
  surface: "#ffffff"
  ink: "#1d1f1f"
  muted: "#626971"
  border: "#dfe3e8"
  link: "#163a96"
  focus-ring: "#4d78e5"
  focus-inner: "#ffffff"
  error: "#b42318"
  success: "#127044"
  scrollbar-track: "#e2e8f0"
  surface-soft: "#f7f8fb"
  dark-neutral-bg: "#0f141b"
  dark-surface: "#171e27"
  dark-surface-raised: "#202a35"
  dark-surface-soft: "#242d38"
  dark-ink: "#f2f4f7"
  dark-muted: "#b8c1cc"
  dark-border: "#3c4755"
  dark-link: "#a9beff"
  dark-focus-ring: "#93adff"
  dark-focus-inner: "#0f141b"
  dark-error: "#ffadb5"
  dark-success: "#72dcb0"
  dark-scrollbar-track: "#202a35"
typography:
  display:
    fontFamily: '"Trip Sans", sans-serif'
    fontSize: "clamp(2.3rem, 8vw, 6.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "normal"
  headline:
    fontFamily: '"Trip Sans", sans-serif'
    fontSize: "clamp(1.8rem, 3vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: '"Trip Sans", sans-serif'
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "normal"
  body:
    fontFamily: '"Trip Sans", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: '"Trip Sans", sans-serif'
    fontSize: "0.85rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
rounded:
  pill: "999px"
  card: "1rem"
  input: "1rem"
  panel: "1.75rem"
  status: "1.5rem"
spacing:
  section: "4.5rem"
  container: "min(100% - 2rem, 1280px)"
  card-gap: "1.25rem"
  component-gap: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.875rem 1.5rem"
  button-primary-hover:
    backgroundColor: "#c57007"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.875rem 1.5rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.25rem"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.25rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "0"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "1rem"
---

# Design System: Sun Pyramids Tours

> **Deployment boundary (2026-06-28):** The public site `https://sunpyramidstours.com` is still the legacy Nuxt production build. Next.js changes in this repo are visible only on the staging preview (`https://sunpyramids-next.vercel.app`) and the current local verified preview (`http://localhost:3003`). Do not use the live production URL or `localhost:3000` to validate Next.js implementation changes. See `docs/next-migration/deployment-boundary.md` for the full rule.

## 1. Overview

**Creative North Star: "The Expert Itinerary"**

This system should feel like a clean, confident, guide-in-hand trip folder from an established local operator. Sun Pyramids Tours is not selling inspiration alone; it is orienting first-time international travelers, lowering perceived risk, and making booking feel safe. The interface is practical, organized, and reassuring — destination imagery creates desire, but structure and clarity create trust.

The design language is **refined and practical**: clear hierarchy, rounded but not playful components, a disciplined blue-and-amber palette, and generous semantic surfaces with clear tonal separation. The light theme retains white surfaces over a soft gray ground; the dark theme translates those same roles into cool navy-charcoal surfaces without becoming cinematic or obscuring conversion content. Every element earns its place by helping the visitor compare, choose, and book with confidence.

This system explicitly rejects the four anti-patterns named in `PRODUCT.md`: cheap-OTA clutter and fake urgency, the 2026 AI cream/sand warm-neutral default, dark moody luxury that hides conversion, and the generic SaaS card-grid scaffold. It also rejects the leftover `--theme-color: #ff4c3b` defined in the legacy production stylesheet; that variable is not used in any rendered element and should not be revived.

**Key Characteristics:**
- One display typeface (Trip Sans) used across all voices, differentiated by weight and scale.
- Deep blue (`#163a96`) for trust, navigation, and primary operator identity; amber (`#f7951d`) for CTAs and warmth.
- Soft gray light-theme ground (`#eeeeee`) with white surfaces; cool navy-charcoal semantic counterparts in dark mode.
- Pill-shaped actions and rounded cards — friendly but never childish.
- Flat-by-default layout; shadows appear only on floating or hovered surfaces.
- Conversion-first scannability: prices, durations, and CTAs are immediately visible.
- An **Editorial Trip Desk** header: two clear desktop tiers collapse into one accessible mobile navigation sheet.
- System-first light/dark theming uses semantic tokens, preserves real photography, and never changes backend data behavior.

## 2. Colors

The palette is a committed two-color brand system on a neutral ground. Blue carries trust and established expertise; amber carries the CTA and the warmth of Egyptian sunlight. Neutrals stay cool and restrained so the body background never drifts into cream or sand.

### Primary
- **Anchor Blue** (`#163a96`): The brand’s structural identity color. Use it for headings and important text hierarchy, links, secondary actions, selected states, controls, and restrained structural accents. It conveys established operator trust; it is not a default full-section fill.

### Secondary
- **Amber CTA** (`#f7951d`): The conversion color. Use it for primary actions, small active-route markers, prices, and restrained emphasis; pair Amber buttons with **Ink text** (`#1d1f1f`) in both themes. Hover darkens to `#c57007`. Amber is never a large decorative surface.

### Neutral
- **Soft Gray Ground** (`#eeeeee`): The light-theme page background. Cool, light, and practical — not warm cream, not stark white. This is the production site source of truth and is now implemented in the Next.js repo; the previous `#f9fafb` migration-era divergence has been reconciled.
- **White Surface** (`#ffffff`): Light-theme cards, panels, dropdowns, modals, inputs, and the shortcut panel float on this.
- **Ink** (`#1d1f1f`): Primary body and heading text. Near-black with a slight cool shift.
- **Muted Gray** (`#626971`): Light-theme secondary text, summaries, durations, and metadata. Must maintain ≥ 4.5:1 contrast on its assigned surface.
- **Divider/Border** (`#dfe3e8`): Light-theme card borders, input borders, and section separators.

### Semantic Themes

Components consume roles rather than theme-specific literals. Light uses page `#eeeeee`, card/raised `#ffffff`, soft `#f7f8fb`, primary text `#1d1f1f`, secondary text `#626971`, subtle border `#dfe3e8`, link `#163a96`, focus `#4d78e5`, and focus-inner `#ffffff`. Dark maps the same roles to page `#0f141b`, card `#171e27`, raised `#202a35`, soft `#242d38`, primary text `#f2f4f7`, secondary text `#b8c1cc`, subtle border `#3c4755`, link `#a9beff`, focus `#93adff`, and focus-inner `#0f141b`.

The brand colors do not swap with the theme: Anchor Blue and Amber remain fixed identity colors. Dark mode changes page chrome, surface, text, border, link, focus, overlay, and form roles while keeping information hierarchy and conversion prominence intact.

### Utility
- **Error Text:** `#b42318` in light and `#ffadb5` in dark for destructive actions, form errors, and payment failure states.
- **Success Text:** `#127044` in light and `#72dcb0` in dark for confirmations, help links, and positive status.
- **Focus Ring:** `#4d78e5` in light and `#93adff` in dark, paired with the current page as the inner color. Every interactive element retains a visible keyboard focus indicator.
- **Scrollbar:** Amber thumb (`#f7951d`) on track `#e2e8f0` in light and `#202a35` in dark.

### Named Rules
**The Production Palette Rule.** The rendered production site is the source of truth: Anchor Blue `#163a96`, Amber `#f7951d`, Soft Gray `#eeeeee`, Ink `#1d1f1f`. The CSS variable `--theme-color: #ff4c3b` exists in the legacy stylesheet but is unused; do not reintroduce it.

**The Cool-Gray Body Rule.** The light-theme page background must remain a cool light gray; the dark-theme counterpart is cool navy-charcoal. Warm cream, sand, beige, or parchment grounds are forbidden — they read as the generic 2026 AI travel aesthetic and undermine the brand’s distinctive blue + amber identity.

**The Semantic Theme Rule.** Never hardcode light-theme surface or text colors inside a component that participates in dark mode. Use the semantic surface, text, border, link, focus, error, success, and scrollbar roles so hierarchy and contrast survive both themes.

**The Legible Dark Rule.** Dark mode is a user viewing preference, not a dark-luxury art direction. Keep content scannable, avoid unnecessary full-section Anchor Blue, and preserve Amber CTAs with Ink text.

## 3. Typography

**Display Font:** Trip Sans (woff2, weights 400 / 500 / 700)
**Body Font:** Trip Sans
**Label/Mono Font:** *none — use Trip Sans at smaller weights*

**Character:** A single geometric sans family keeps the voice unified and practical. Weight and scale do all the differentiation. The system is confident without being loud; headings are bold and tight, body text is open and readable.

### Hierarchy
- **Display** (700, `clamp(2.3rem, 8vw, 6.25rem)`, line-height 1.05): Hero headlines only. Used over full-bleed imagery with a subtle dark overlay and text shadow for legibility.
- **Headline** (700, `clamp(1.8rem, 3vw, 3rem)`, line-height 1.1): Section headings (`Egypt Easter Tours`, `Popular Destinations`, `Make Your Trip`). Left-aligned or centered depending on section; never smaller than the title below it.
- **Title** (700, 1.5rem, line-height 1.45): Card titles, FAQ summaries, sub-section headings.
- **Body** (400, 1rem, line-height 1.7): Long-form copy, tour summaries, blog excerpts. Max line length 70ch.
- **Label** (700, 0.85rem, letter-spacing 0): Tags, metadata pills, prices, durations, uppercase eyebrows when used sparingly.

### Named Rules
**The One Voice Rule.** Trip Sans is the only typeface. Do not pair it with a second sans or a display serif. Differentiate by weight (400 / 500 / 700) and scale, not by family.

**The Readability Rule.** Hero text must always sit over a dark overlay or text shadow so white type remains legible on bright photography. Body and secondary text must hit WCAG AA contrast against the semantic surface assigned in each theme; never reuse a light-theme muted literal on a dark or tinted surface.

## 4. Layout

The site shell uses a wide operator-desk composition: a maximum shell of `1440px`, readable text constrained to `780px`, responsive gutters (`clamp(1rem, 3.2vw, 3rem)`), and generous section rhythm (`clamp(4.75rem, 8vw, 8.5rem)`). At mobile widths below `768px`, gutters tighten and section spacing settles at `4.5rem`.

### Editorial Trip Desk Navigation

- **Desktop (`>1260px`):** The framed, raised header has two persistent tiers. The first is a minimum `66px` brand-and-utility row containing the approved logo, search, language/currency, theme, cart, and sign-in controls. The second is a minimum `50px` route-and-conversion row containing primary navigation, Special Offer, and the Amber Make Your Trip action. At the top of the home page the frame floats with four `16px` corners; after scrolling it visually docks while retaining its bottom corners.
- **Compact and mobile (`≤1260px`):** The desktop navigation tier is replaced by a menu trigger and a right-side sheet up to `440px` wide (`94vw`), becoming full-width at `380px` and below. The sheet groups logo/close, search, route links, tour disclosure, utilities, and conversion actions in a predictable scan order; narrow utility/action grids collapse to one column.
- **Accessible sheet behavior:** The menu trigger exposes `aria-controls` and `aria-expanded`; the sheet is a named modal dialog. Opening it locks body scroll, makes background content inert, and moves focus inside. Tab and Shift+Tab remain trapped, Escape or backdrop interaction closes it, and focus returns to the trigger. Tour children use a native disclosure rather than hidden hover-only navigation.

## 5. Elevation & Depth

The system is **flat with structural shadows**. Depth is created mainly through semantic background separation (page → card → raised/soft surface), subtle borders, and generous spacing. Shadows are reserved for elements that need to feel temporarily raised or floating: tour-card hover lifts, dropdown panels, the shortcut/search panel, sticky bottom bars, hero stat bars, and the Editorial Trip Desk frame.

### Shadow Vocabulary
- **Card Hover Lift** (`0 18px 44px rgba(0, 0, 0, 0.11)`): Used on `.tour-card` and `.blog-card` hover states.
- **Floating Panel** (`0 8px 24px rgba(0, 0, 0, 0.095)`): Dropdown menus and elevated cards at rest.
- **Hero Stats Bar** (`0 18px 50px rgba(0, 0, 0, 0.2)`): The semantic card-surface trust bar that floats above the hero image.
- **Shortcut / Help Panel** (`0 16px 50px rgba(0, 0, 0, 0.2)`): The search shortcut panel and the help-band card.
- **Bottom Bar** (`0 0 16px rgba(0, 0, 0, 0.1)`): Mobile fixed bottom navigation.

### Named Rules
**The Structural-Shadow Rule.** Shadows are functional, not decorative. If a surface does not need to float above other content, it does not get a shadow.

## 6. Shapes

The form language is gently rounded and practical: `10px` utility controls, `12px` search fields, `16px` cards/header frames/dropdowns, `24px` larger panels, and `999px` true pills. Borders use the semantic subtle-border role. Rounded geometry communicates care without turning the travel service into a playful consumer app.

## 7. Components

### Buttons
- **Shape:** Primary content actions use a pill radius (`999px`); compact Editorial Trip Desk actions use the `10px` utility-control radius so the header reads as an operator console rather than a row of pills.
- **Primary:** Amber background (`#f7951d`), Ink text (`#1d1f1f`), `0.875rem 1.5rem` padding, font-weight 700. Used for search, "View Packages", "See more", and "Make Your Trip".
- **Hover / Focus:** Background darkens to `#c57007` while Ink text remains; a subtle `translateY(-1px)` lift is allowed on primary buttons. Transition `180ms ease` for background, color, and transform.
- **Outline:** Transparent background with semantic border and text roles. Hover increases surface contrast without replacing a visible focus treatment.
- **Ghost / Header:** Transparent with the semantic subtle border (Sign in, language, theme, cart, menu). Hover uses the Anchor-soft surface and semantic link color.
- **Tab-style:** Some grouped actions use `20px 20px 0 0` top radius for active tabs (shortcut panel, "Make Trip" / "Find your trip" / "Rent Car").

### Chips / Tags
- **Style:** `#f7f7f7` background, `#555` text, `999px` radius, `0.4rem 0.7rem` padding.
- **Use:** Tour metadata (destination, category), filter pills, small labels. Keep text at `0.82rem` and weight 500–700.

### Cards / Containers
- **Corner Style:** `1rem` radius.
- **Background:** The semantic card surface: white (`#ffffff`) in light and cool charcoal (`#171e27`) in dark.
- **Border:** `1px solid` the semantic subtle border (`#dfe3e8` light / `#3c4755` dark) on tour cards, blog cards, FAQ items, account cards, and cart summaries.
- **Shadow Strategy:** No shadow at rest; lift to `0 18px 44px rgba(0,0,0,0.11)` on hover for tour/blog cards.
- **Internal Padding:** `1rem` for card bodies; `1.5rem` for larger content cards (about goals, contact panels, planner forms).

### Inputs / Fields
- **Style:** Semantic raised background, `1px solid` semantic subtle border, `1rem` radius, `1rem` padding.
- **Focus:** Border shifts to the semantic focus color (`#4d78e5` light / `#93adff` dark) with a visible outline or theme-derived glow. No outline removal without a replacement.
- **Placeholder:** Use semantic secondary text (`#626971` light / `#b8c1cc` dark) only where contrast remains AA.
- **Error / Disabled:** Error state uses the semantic error text and border treatment; disabled uses reduced emphasis without sacrificing legibility.

### Navigation
- **Header:** Follow the two-tier **Editorial Trip Desk** layout in Layout. The frame uses the semantic raised surface and subtle border; the search field uses the soft surface. Utility controls are compact rounded rectangles, not decorative pills.
- **Desktop Nav:** Ink/primary semantic text at weight 650. Hover/open states use the soft surface and semantic link color. The current route is exposed with `aria-current="page"` and a `3px` Amber underline; hover may preview the same underline. Parent tour navigation remains active for tour-category and tour-detail descendants.
- **Dropdown:** A two-column raised panel (`470px`, `16px` radius) with a subtle border and structural shadow. It opens by explicit button activation, reports `aria-expanded`, closes when focus leaves or Escape is pressed, and returns focus to its trigger.
- **Mobile Sheet:** Follow the modal interaction contract in Layout. Active routes use the semantic link color plus a `3px` inset Amber marker. Search, theme, language/currency, cart, sign-in, offers, and trip-planning actions remain present in the sheet.
- **Bottom Bar (mobile):** Fixed semantic raised surface with `0 0 16px rgba(0,0,0,0.1)` shadow, four icon-link columns, and theme-aware icon/text color.

### Approved Logo
- Use only the approved `/images/logo.png` asset for branded site marks. Keep its natural proportions, meaningful alt text, and home-link label; do not redraw, recolor, invert, or filter the logo.
- In dark navigation and account chrome, preserve the original artwork on a compact white backing instead of altering the pixels. Header and mobile-sheet instances use a `6px` backing radius with `3px 6px` padding.

### Theme Preference
- The root `html[data-theme]` attribute is the single styling switch. The persisted key is exactly `sunpyramids-theme`, and its only valid explicit values are `light` and `dark`.
- **System first, explicit choice wins:** With no stored choice, resolve and continue following `prefers-color-scheme`. Once the visitor chooses a theme, persist it and stop following system changes until that stored choice is removed.
- A synchronous head bootstrap resolves the stored or system theme before body content is painted, updates both `data-theme` and `color-scheme`, and suppresses expected hydration mismatch. This prevents a wrong-theme flash without a React provider.
- The toggle is a real button with a localized accessible label, synchronized `aria-pressed`, and theme-appropriate sun/moon state. Visible Light/Dark copy is localized in the mobile sheet for every supported locale (`en`, `fr`, `de`, `it`, `pt`, `es`, `zh`); utility labels must remain locale-aware and icon-only controls must keep accessible names.
- Theme preference is presentation-only: it adds no provider, runtime package, API request, production-data snapshot, cache rule, ISR behavior, or backend ownership change.

### Motion & Photography
- Normal state changes use brief `180–220ms` transitions. Under `prefers-reduced-motion: reduce`, smooth scrolling is disabled and transitions collapse to `0.01ms`; no content or control may depend on motion to become available.
- Theme changes recolor interface tokens only. Never apply global brightness, grayscale, inversion, opacity, or tint filters to destination, tour, editorial, or customer photography. Use a local semantic overlay only when text legibility requires it. UI glyph treatment is not permission to filter photography.

### Hero
- **Structure:** Full-viewport height, full-bleed background image or video, dark overlay (`rgba(0,0,0,0.34)`), centered white text.
- **Stats Bar:** Semantic card surface floating at the bottom with `1.5rem` radius and heavy shadow; four stats use semantic dividers. Stat values use Anchor Blue and labels use semantic secondary text.

### Signature: Search Shortcut Panel
- Semantic raised floating panel with `1.75rem` radius and heavy shadow. Tab row at top with pill tabs. One text input, one select, one primary button. Sits above the hero fold. This is the site’s most distinctive conversion component.

## 8. Do's and Don'ts

### Do:
- **Do** use the production-rendered palette as source of truth: Anchor Blue `#163a96`, Amber `#f7951d`, Soft Gray `#eeeeee`, Ink `#1d1f1f`.
- **Do** keep the light-theme body background cool gray and its dark counterpart cool navy-charcoal; let warmth come from imagery and the Amber accent, not from the page ground.
- **Do** use Trip Sans as the single typeface for every text role; differentiate by weight and scale.
- **Do** make primary content CTAs pill-shaped, Amber, and high-contrast with Ink text; use the compact `10px` treatment for Editorial Trip Desk actions, and reserve Anchor Blue for hierarchy, links, secondary actions, selected states, and structural accents.
- **Do** use semantic card and border roles so the same component maps cleanly between light and dark themes.
- **Do** add shadows only to floating surfaces (dropdowns, shortcut panel, hero stats, mobile bottom bar, hover lifts).
- **Do** ensure all body text meets WCAG AA contrast; placeholder text must also hit 4.5:1.
- **Do** provide visible `:focus-visible` treatment on every interactive element using `#4d78e5` in light and `#93adff` in dark, with the current page token as the inner separation color.
- **Do** keep the light-theme global page background at `#eeeeee`. The migration-era `#f9fafb` divergence has been reconciled.
- **Do** mark active navigation with `aria-current` and the restrained Amber route indicator; never rely on color alone.
- **Do** preserve focus trapping, Escape/backdrop dismissal, background inertness, scroll locking, and trigger focus restoration in the mobile navigation sheet.
- **Do** honor the system theme until the visitor explicitly chooses one, then preserve that choice under `sunpyramids-theme`.

### Don't:
- **Don't** reintroduce the unused legacy `--theme-color: #ff4c3b`. It is not part of the rendered production palette.
- **Don't** use a warm cream, sand, beige, or parchment body background — that is the generic 2026 AI travel aesthetic and conflicts with the brand’s cool gray + blue + amber identity.
- **Don't** add cheap-OTA clutter: countdown timers, fake urgency badges, "72 people viewing now", flashing deal stickers, or noisy booking pressure.
- **Don't** treat dark mode as dark, moody luxury. It is an accessible semantic translation and must stay readable, scannable, and conversion-focused; do not bury pricing or CTAs under cinematic darkness.
- **Don't** build generic SaaS card-grid scaffolds with identical icon + heading + text cards repeated endlessly.
- **Don't** put tiny uppercase tracked eyebrows above every section; one deliberate eyebrow is voice, repeated eyebrows are AI grammar.
- **Don't** use gradient text, glassmorphism as default, or side-stripe colored borders as card accents.
- **Don't** use arbitrary z-index values like `9999`; maintain the semantic scale (header 50, bottom bar 60, drawer backdrop 100).
- **Don't** filter, recolor, or invert the approved logo; use its compact white dark-theme backing.
- **Don't** apply dark-mode filters to photography or encode theme preference in a provider, dependency, API response, cache, or backend-controlled record.
