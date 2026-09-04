# TF Study Shelf — UI/UX Requirements

**Document:** 05 — UI/UX Requirements  
**Version:** 1.0  
**Date:** September 2, 2026  
**Applies to:** [SHARED] Web Platform + Mobile App  

---

## 1. Design System Foundation

### 1.1 Design Language

**Editorial + Academic + Modern**

The product should feel like a **premium reading app crossed with a modern study workspace** — not a generic "education app" clone, not a cartoonish kids' app, and not a plain PDF viewer.

### 1.2 Color System

| Token | Hex | Usage |
|---|---|---|
| `--color-primary-dark` | `#212121` | Text (light mode), Background (dark mode) |
| `--color-accent` | `#FF7759` | CTAs, highlights, active states, gradient |
| `--color-off-white` | `#FAFAFA` | Background (light mode), Text (dark mode) |

**Derived Colors (alpha variants only):**

| Token | Value | Usage |
|---|---|---|
| `--color-border-light` | `rgba(33, 33, 33, 0.12)` | Borders in light mode |
| `--color-border-dark` | `rgba(250, 250, 250, 0.12)` | Borders in dark mode |
| `--color-surface-elevated` | `rgba(33, 33, 33, 0.04)` | Elevated surfaces (light) |
| `--color-accent-hover` | `rgba(255, 119, 89, 0.85)` | Accent hover state |
| `--color-accent-pressed` | `rgba(255, 119, 89, 0.7)` | Accent pressed state |
| `--color-accent-subtle` | `rgba(255, 119, 89, 0.1)` | Accent backgrounds |
| `--color-disabled` | `rgba(33, 33, 33, 0.38)` | Disabled elements |
| `--color-overlay` | `rgba(33, 33, 33, 0.5)` | Modal overlays |

**Hard Rule:** No unrelated blue/green/purple accent families. All secondary shades must be alpha variants of the three base colors.

### 1.3 Typography

**Primary Font:** Manrope (Google Fonts)

| Style | Weight | Size | Line Height | Usage |
|---|---|---|---|---|
| Display Large | 700 | 32px | 40px | Hero headings |
| Display Medium | 700 | 28px | 36px | Section headings |
| Headline | 600 | 24px | 32px | Page titles |
| Title Large | 600 | 20px | 28px | Card titles, subtitles |
| Title Medium | 600 | 16px | 24px | Section headers |
| Body Large | 400 | 16px | 24px | Primary body text |
| Body Medium | 400 | 14px | 20px | Secondary body text |
| Body Small | 400 | 12px | 16px | Captions, metadata |
| Label Large | 500 | 14px | 20px | Buttons, tabs |
| Label Medium | 500 | 12px | 16px | Chips, badges |
| Label Small | 500 | 10px | 14px | Overlines |

**Secondary Font:** Geist Mono

| Usage | Size | Purpose |
|---|---|---|
| Page numbers | 14px | `PAGE 048 / 320` |
| Percentages | 14px | `76%` |
| Reading time | 12px | `8h 23m` |
| Statistics | 14-16px | Quiz scores, streaks, counts |
| Countdown | 14px | `23h 41m remaining` |

**Rule:** Never use Geist Mono for normal reading paragraphs.

### 1.4 Spacing System

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Inline spacing, icon gaps |
| `--space-sm` | 8px | Tight component spacing |
| `--space-md` | 16px | Standard component spacing |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major section breaks |
| `--space-2xl` | 48px | Page-level spacing |
| `--space-3xl` | 64px | Hero spacing |

### 1.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Chips, small buttons |
| `--radius-md` | 12px | Cards, input fields |
| `--radius-lg` | 16px | Large cards, dialogs |
| `--radius-xl` | 24px | Bottom sheets, modals |
| `--radius-full` | 999px | Pills, avatars |

### 1.6 Elevation / Shadows

| Level | Shadow | Usage |
|---|---|---|
| 0 | None | Flat elements |
| 1 | `0 1px 3px rgba(0,0,0,0.08)` | Cards |
| 2 | `0 2px 8px rgba(0,0,0,0.12)` | Floating elements |
| 3 | `0 4px 16px rgba(0,0,0,0.16)` | Dialogs, tooltips |
| 4 | `0 8px 32px rgba(0,0,0,0.20)` | Bottom sheets |

**Design Rule:** Use subtle shadows. Avoid heavy drop shadows that break the clean aesthetic.

---

## 2. Gradient System

### 2.1 Primary Gradient

**Signature:** `linear-gradient(135deg, #FF7759 0%, #212121 100%)`

### 2.2 Usage Rules

**✅ Use for:**
- Hero banners and featured content headers
- Primary CTA buttons (e.g., "Read Now")
- Featured/book hero cards
- Progress indicators (reading progress bars)
- Achievement/completion celebration moments
- Empty states (subtle background)
- Selected/active card states
- Special section headers

**❌ Do NOT use for:**
- Ordinary list rows
- Standard/secondary buttons
- Full-page backgrounds
- Every card in a grid
- Navigation bars
- Input fields

**Restraint is what keeps the gradient feeling premium.**

---

## 3. Component Library

### 3.1 Buttons

**Primary Button:**
- Background: `#FF7759`
- Text: `#FAFAFA`
- Border radius: `--radius-md` (12px)
- Padding: 16px 24px
- Font: Manrope 500, 14px
- States: Default → Hover (0.85 opacity) → Pressed (0.7 opacity) → Disabled (0.38 opacity)

**Secondary Button:**
- Background: transparent
- Border: 1px solid `#FF7759`
- Text: `#FF7759`
- Same sizing as primary

**Text Button:**
- Background: transparent
- Text: `#FF7759`
- No border

**Gradient Button (Hero CTAs only):**
- Background: Primary gradient
- Text: `#FAFAFA`
- Used sparingly for "Read Now" and major CTAs

### 3.2 Cards

**Standard Book Card:**
```
┌──────────────────┐
│  ┌────────────┐  │
│  │   Cover    │  │
│  │   Image    │  │
│  └────────────┘  │
│                  │
│  Title (2 lines) │
│  Author          │
│  ⭐ 4.8 · 📄 320 │
│                  │
│  [♥ Save]        │
└──────────────────┘

Card specs:
  Width: Flexible (grid responsive)
  Border: 1px solid rgba(33,33,33,0.08)
  Border radius: 12px
  Padding: 12px
  Shadow: Level 1
  Cover image: 3:4 aspect ratio
```

**Progress Card (Continue Reading):**
```
┌────────────────────────────────────┐
│  ┌──────┐                          │
│  │Cover │  Atomic Habits           │
│  │      │  James Clear             │
│  │      │                          │
│  └──────┘  ▓▓▓▓▓▓▓░░░ 72%        │
│            PAGE 230 / 320          │
└────────────────────────────────────┘
  
  Width: 280px (horizontal scroll)
  Background: Subtle accent tint (light mode) or elevated surface (dark)
```

**Study Card:**
```
┌──────────────────┐
│  📝              │
│                  │
│  Quizzes         │
│  23 available    │
└──────────────────┘

  Size: Square or 16:9
  Icon: Large, centered
  Background: Accent subtle tint
```

### 3.3 Input Fields

**Text Input:**
- Border: 1px solid `rgba(33,33,33,0.2)`
- Focus border: `#FF7759`
- Border radius: 12px
- Padding: 12px 16px
- Label: Above field, Manrope 500 12px
- Error: Red-orange accent variant, error text below field
- Placeholder: `rgba(33,33,33,0.4)`

**Search Bar:**
- Background: `rgba(33,33,33,0.04)` (light) / `rgba(250,250,250,0.08)` (dark)
- Border radius: 12px
- Leading icon: Search
- Trailing icon: Clear (when has value)
- Placeholder: "Search books, topics, questions…"

### 3.4 Bottom Navigation [APP]

**Material 3 NavigationBar:**
- 5 items: Home, Explore, Study, Shelf, Profile
- Active indicator: `#FF7759` with 10% opacity background
- Active icon/label: `#FF7759`
- Inactive icon/label: `rgba(33,33,33,0.6)`
- Banner ad sits ABOVE the navigation bar

### 3.5 Top Navigation [WEB]

**Admin Panel:**
- Fixed top bar, `#212121` background
- Logo left, navigation center, profile right
- Active tab: `#FF7759` underline
- Hover: `rgba(255,119,89,0.1)` background

**User-Facing Web:**
- Fixed top bar, `#FAFAFA` background (light) / `#212121` (dark)
- Logo left, search center, auth right
- Responsive: Hamburger menu on mobile

### 3.6 Dialogs & Bottom Sheets [APP]

**AlertDialog:**
- Border radius: 16px
- Background: Surface color
- Title: Manrope 600, 18px
- Body: Manrope 400, 14px
- Actions: Right-aligned, primary + secondary buttons
- Max width: 320px

**Bottom Sheet:**
- Border radius: Top 24px
- Background: Surface color
- Handle indicator: 4px × 40px, centered
- Max height: 90% of screen

### 3.7 Chips & Badges

**Category Chip:**
```
  ┌────────────┐
  │  Science   │
  └────────────┘
  
  Background: rgba(255,119,89,0.1)
  Text: #FF7759
  Border radius: --radius-sm (8px)
  Padding: 6px 12px
  Font: Manrope 500, 12px
```

**Status Badge:**
```
  Published    → accent background, white text
  Draft        → subtle gray
  Expired      → red-ish alpha variant
  Active       → accent with glow
```

### 3.8 Progress Bars

**Reading Progress:**
- Height: 4px (thin) or 8px (standard)
- Background: `rgba(33,33,33,0.1)`
- Fill: Gradient `#FF7759 → #212121`
- Border radius: Full

**Download Progress:**
- Linear, showing percentage
- Same gradient treatment
- With percentage label (Geist Mono)

### 3.9 Empty States

**Structure:**
```
┌─────────────────────────────────────┐
│                                      │
│       [Illustration / Icon]          │
│                                      │
│    "Your shelf is waiting."          │
│                                      │
│    [ Explore Books ]                 │
│                                      │
└─────────────────────────────────────┘
```

**Content:**

| Context | Illustration | Message | CTA |
|---|---|---|---|
| Empty shelf | Open book | "Your shelf is waiting." | Explore Books |
| Empty downloads | Download arrow | "Nothing downloaded yet." | Find Something to Read |
| No search results | Magnifying glass | "No results for 'X'" | — |
| No notes | Pencil | "Start reading to add notes." | Start Reading |
| No highlights | Marker | "Highlight text while reading." | Start Reading |
| No quiz results | Trophy | "Take your first quiz!" | Browse Quizzes |
| No bookmarks | Bookmark | "Bookmark pages while reading." | Start Reading |

---

## 4. Theme System

### 4.1 Light Mode

```css
:root {
  --bg-primary: #FAFAFA;
  --bg-surface: #FFFFFF;
  --bg-elevated: rgba(33, 33, 33, 0.04);
  --text-primary: #212121;
  --text-secondary: rgba(33, 33, 33, 0.6);
  --text-tertiary: rgba(33, 33, 33, 0.38);
  --border: rgba(33, 33, 33, 0.12);
  --accent: #FF7759;
  --accent-on: #FAFAFA;
}
```

### 4.2 Dark Mode

```css
[data-theme="dark"] {
  --bg-primary: #212121;
  --bg-surface: #2A2A2A;
  --bg-elevated: rgba(250, 250, 250, 0.06);
  --text-primary: #FAFAFA;
  --text-secondary: rgba(250, 250, 250, 0.6);
  --text-tertiary: rgba(250, 250, 250, 0.38);
  --border: rgba(250, 250, 250, 0.12);
  --accent: #FF7759;
  --accent-on: #FAFAFA;
}
```

### 4.3 Dim Mode (Reader Only)

```css
[data-theme="dim"] {
  --bg-primary: #1A1A1A;
  --text-primary: #D4D4D4;
  /* Reduced contrast for comfortable night reading */
}
```

---

## 5. Animations & Transitions

### 5.1 Micro-Animations

| Animation | Duration | Easing | Trigger |
|---|---|---|---|
| Page transition | 300ms | ease-in-out | Navigation |
| Card tap feedback | 150ms | ease-out | Tap/click |
| Bottom sheet slide | 350ms | cubic-bezier(0.4, 0, 0.2, 1) | Open/close |
| Highlight appear | 200ms | ease-out | Text selected + category chosen |
| Progress bar fill | 500ms | ease-out | Value update |
| Flashcard flip | 400ms | ease-in-out | Tap to flip |
| Countdown update | none | — | Timer tick (no animation, just update) |
| Fade in content | 200ms | ease-in | Content loaded |
| Success checkmark | 300ms | spring | Action completed |

### 5.2 Animation Rules

**Do:**
- Subtle hover effects on interactive elements
- Smooth page/screen transitions
- Loading shimmer placeholders
- Progress bar animations
- Flashcard flip animation

**Don't:**
- Excessive bouncing or spring effects
- Distracting background animations
- Auto-playing animations that can't be stopped
- Animation during active reading
- Heavy animations on low-end devices

**Accessibility:** Respect `prefers-reduced-motion` (web) / `MediaQuery.disableAnimations` (Flutter). Reduce or disable all non-essential animations.

---

## 6. Reader UI/UX

### 6.1 Reader Layout

**Full-Screen Immersive Mode:**
```
┌─────────────────────────────────────┐
│ ← Chapter 3: Forces    📑 🔍 ⚙️    │ ← Controls (toggle)
├─────────────────────────────────────┤
│                                      │
│  [Book content fills screen]         │
│                                      │
│  Newton's First Law states that      │
│  an object at rest stays at rest     │
│  and an object in motion stays       │
│  in motion with the same speed       │
│  and in the same direction unless    │
│  acted upon by an unbalanced         │
│  force...                            │
│                                      │
│                                      │
├─────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓░░░░░░ 48%  PAGE 048/320   │ ← Progress
└─────────────────────────────────────┘
```

### 6.2 Reader Settings Sheet

```
┌─────────────────────────────────────┐
│  ──── (handle)                       │
│                                      │
│  TEXT SIZE                           │
│  A ──────────●──── A                │
│       Small → Huge                   │
│                                      │
│  LINE SPACING                        │
│  [Compact] [Normal] [Relaxed]       │
│                                      │
│  MARGINS                             │
│  [Narrow] [Normal] [Wide]           │
│                                      │
│  ALIGNMENT                           │
│  [Left] [Justify]                   │
│                                      │
│  PAGE MODE                           │
│  [Paged] [Scroll]                   │
│                                      │
│  THEME                               │
│  [☀️ Light] [🌙 Dark] [🔅 Dim]     │
│                                      │
│  [Keep Screen Awake] ──── (toggle)  │
└─────────────────────────────────────┘
```

### 6.3 Text Selection Toolbar

**Floating toolbar above selected text:**
```
┌────────────────────────────────────┐
│ [🖍 Highlight] [📝 Note] [📋 Copy] │
│ [📤 Share] [💬 Ask]                 │
└────────────────────────────────────┘
```

---

## 7. Responsive Design [WEB]

### 7.1 Breakpoints

| Name | Width | Columns | Gutter |
|---|---|---|---|
| Mobile | 320 – 767px | 4 | 16px |
| Tablet | 768 – 1023px | 8 | 24px |
| Desktop | 1024 – 1439px | 12 | 24px |
| Wide | 1440px+ | 12 | 32px |

### 7.2 Layout Adaptations

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Book grid | 2 columns | 3-4 columns | 4-5 columns |
| Navigation | Bottom bar | Side rail | Top bar + sidebar |
| Reader | Full width | 680px max | 720px max |
| Search | Full-screen | Inline | Inline + dropdown |
| Sidebar | Drawer | Collapsible | Persistent |
| Admin panel | View-only dashboard | Full functional | Full featured |
| Cards | Stack vertical | 2-up | 3-4 up |

### 7.3 Adaptive Layout [APP — Flutter]

```dart
class AdaptiveLayout extends StatelessWidget {
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    
    if (width < 600) return MobileLayout();
    if (width < 900) return TabletLayout();
    return DesktopLayout();
  }
}
```

**Support both phone and tablet layouts, portrait and landscape**, especially for reader and PDF viewer.

---

## 8. Accessibility Requirements

### 8.1 Core Requirements

| Requirement | Standard | Platform |
|---|---|---|
| Screen reader support | TalkBack (Android), ARIA (Web) | Both |
| Content descriptions | All interactive elements labeled | Both |
| Touch targets | Minimum 48×48dp (app), 44×44px (web) | Both |
| Text scaling | Respect system text scale factor | Both |
| Color contrast | Minimum 4.5:1 (WCAG AA) | Both |
| Reduced motion | Respect system preference | Both |
| Keyboard navigation | Full keyboard access | Web |
| Focus indicators | Visible focus rings | Both |
| Orientation | Portrait + Landscape | App |
| Large text mode | Reader-independent of system scale | App |

### 8.2 Semantic Structure [WEB]

```html
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">
  <article>
    <h1>Book Title</h1>
    <section aria-label="Book details">...</section>
    <section aria-label="Chapters">...</section>
  </article>
</main>
<footer role="contentinfo">...</footer>
```

### 8.3 Flutter Semantics [APP]

```dart
Semantics(
  label: 'Book: Atomic Habits by James Clear',
  hint: 'Double tap to open book details',
  child: BookCard(book: book),
)
```

---

## 9. Loading & Skeleton States

### 9.1 Shimmer Loading

Use shimmer placeholders that match the layout of the expected content:

**Book Card Shimmer:**
```
┌──────────────────┐
│  ┌────────────┐  │
│  │ ░░░░░░░░░░ │  │
│  │ ░░░░░░░░░░ │  │
│  └────────────┘  │
│  ░░░░░░░░░░░░░   │
│  ░░░░░░░░        │
│  ░░░░░░          │
└──────────────────┘
```

### 9.2 Loading Indicators

- **Full-page loading:** Centered circular progress (accent color)
- **Inline loading:** Small circular indicator within context
- **Pull-to-refresh:** Standard Material refresh indicator
- **Download progress:** Linear progress bar with percentage

---

## 10. Icon System

### 10.1 Icon Style

- **Style:** Outlined (Material Icons)
- **Size:** 24dp default, 20dp compact, 32dp featured
- **Color:** Inherits text color; accent for active states
- **Consistency:** Use Material Icons throughout; no mixing icon sets

### 10.2 Key Icons

| Element | Icon |
|---|---|
| Home | `home_outlined` / `home_filled` |
| Explore | `explore_outlined` / `explore_filled` |
| Study | `school_outlined` / `school_filled` |
| Shelf | `library_books_outlined` / `library_books_filled` |
| Profile | `person_outlined` / `person_filled` |
| Search | `search` |
| Bookmark | `bookmark_border` / `bookmark` |
| Save/Favorite | `favorite_border` / `favorite` |
| Download | `download` |
| Offline | `cloud_off` |
| Settings | `settings` |
| Back | `arrow_back` |
| More | `more_vert` |
| Share | `share` |
| Note | `note_add` |
| Highlight | `format_paint` |
| Quiz | `quiz` |
| Flashcard | `style` |

---

*This document defines the complete UI/UX requirements and design system. For implementation details, see [02 Web Platform PRD](./02_Web_Platform_PRD.md) and [03 Mobile App PRD](./03_Mobile_App_PRD_Flutter.md).*
