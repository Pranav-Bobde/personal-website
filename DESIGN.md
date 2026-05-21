web application/stitch/projects/6170620633465672880/screens/4db437532d364b1395cef33d169ef57b

# Design Specification: Pranav Bobde's Personal Site

## Visual Identity

A minimalist, terminal-inspired aesthetic focused on high readability, technical clarity, and personal branding. The design leverages a dark theme with high-contrast accents to evoke a developer-centric environment.

## Color Palette

### Core Colors

- **Background (Primary):** `#000000` (Pure Black)
- **Text (Primary):** `#FFFFFF` (White) — Used for primary headings and body text.
- **Accent (Secondary):** `#00FFFF` (Cyan/Aqua) — Used for interactive elements, highlights, and icons.
- **Muted Text:** `#888888` (Medium Gray) — Used for secondary information like location and company details.

## Typography

### Headings

- **Font Family:** Monospace / System UI Monospace
- **Weight:** Bold (700+)
- **Style:** Clean, blocky lettering reminiscent of terminal headers.

### Body Copy

- **Font Family:** Monospace (e.g., Courier New, SF Mono, Roboto Mono)
- **Size:** 16px - 18px
- **Line Height:** 1.6
- **Intent:** Prioritizes code-like legibility and a raw, functional feel.

## Layout & Components

### Navigation

- Simple horizontal list centered at the top.
- Format: `[shortcut] label` (e.g., `[h] home`).
- Hover/Active State: Cyan text color.

### Hero Section

- Vertical stack: Name (Large Heading) -> Location -> Role/Company.
- Uses icons (location pin, briefcase) in muted gray for visual cues.

### Links Section

- Section header marked with a cyan asterisk (`* links`).
- Link items follow the navigation pattern: `[key] platform`.

### Blog Detail Layout

- Blog detail pages use a terminal-doc reader layout.
- Desktop: left sticky table-of-content rail plus aligned article column.
- TOC is always visible on desktop; no toggle/collapsed state.
- TOC width should stay near `288px`; article width should stay near `768px`.
- Header, date, intro, and article content must share the same left edge.
- Body copy stays compact: roughly `16px` with readable line height, not oversized essay styling.
- Mobile: hide TOC and keep article full-width.
- Preserve minimal terminal styling: black background, white/cyan text, muted gray metadata.

## Design Principles

1. **First Principles Thinking:** The design reflects the user's philosophy—removing unnecessary fluff to focus on core functionality and content.
2. **Terminal Aesthetic:** Low-latency feel, monospace fonts, and high-contrast color choices.
3. **Optimized for Workflow:** Minimalist navigation and clear information hierarchy.
