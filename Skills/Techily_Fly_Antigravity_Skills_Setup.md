# Techily Fly — Antigravity Agent Skills & Project Setup

## Purpose

This file is the installation and agent-configuration reference for the Techily Fly website project.

The goal is to give Google Antigravity a strong, specialized development environment for:

- UX/UI design
- Astro development
- Cloudflare deployment
- performance optimization
- accessibility
- SEO and GEO/discoverability
- admin/CMS development
- security
- testing and QA
- Google AdSense readiness
- production deployment

The project must remain **PHP-free**, **Astro-first**, **Cloudflare-first**, fast, reliable, maintainable, and manageable from the admin panel.

---

# 1. Source-of-Truth Documents

Antigravity must use these project documents as the primary implementation references:

1. `Techily_Fly_TF_Brand_Design_System_PRD.md`
2. `Techily_Fly_Complete_Website_PRD.md`
3. The current Techily Fly website/content source
4. The IdeaRise website/content source for interaction, layout, motion, and UX inspiration only

## Source priority

When sources conflict, follow this order:

1. Techily Fly Brand Design System
2. Techily Fly Complete Website PRD
3. Techily Fly existing business/content data
4. IdeaRise interaction/layout inspiration
5. Generic framework conventions

IdeaRise must **not** replace Techily Fly's brand colors, typography, visual identity, or content ownership.

---

# 2. Required Installation Method

Use the Skills CLI where possible.

Official/general documentation:

- https://skills.sh/

Before installing anything, inspect the skill documentation and confirm that the skill is appropriate for this project.


---

# 3. Project Bootstrap, Current Astro Guidance, and Agent Context

## 3.1 Create the Astro project with the official CLI

Official Astro documentation:

- https://docs.astro.build/
- https://docs.astro.build/en/install-and-setup/
- https://docs.astro.build/en/guides/build-with-ai/

Start the project with the official Astro wizard:

```bash
npm create astro@latest
```

Astro currently documents `npm create astro@latest` as the preferred project bootstrap command. citeturn901233search1turn901233search3

For Techily Fly, the agent should use the Astro wizard and make deliberate choices rather than blindly accepting defaults.

Recommended starting direction:

- TypeScript: strict where practical
- Minimal/empty starter unless an existing official starter materially accelerates the project
- Git: enabled
- Static-first architecture
- Add integrations with Astro's official `astro add` flow where supported

Astro's current installation docs explicitly support adding integrations during project creation and using `astro add` for official integrations. citeturn901233search4

## 3.2 Astro AI development guidance is mandatory reference material

Read and follow:

https://docs.astro.build/en/guides/build-with-ai/

This guide exists specifically because AI coding tools can use outdated Astro APIs. Astro recommends current documentation access, project rules, `astro add`, and verification of current APIs. citeturn901233search5

Agent rule:

> Before making non-trivial Astro architectural decisions, verify the current Astro documentation and prefer current APIs over remembered patterns.

## 3.3 Astro Docs MCP / current documentation access

Where Antigravity supports MCP or equivalent documentation connectors, enable current Astro documentation access.

Purpose:

- reduce stale Astro API usage
- verify sessions/actions/content collections/current integrations
- verify current deployment guidance
- verify current compiler/build behavior

Do not rely solely on model memory for framework APIs that may have changed.

---

# 4. DESIGN.md / getdesign Setup

## 4.1 getdesign CLI

Official package/documentation:

- https://www.npmjs.com/package/getdesign
- https://getdesign.md/
- https://getdesign.md/vercel/design-md

The `getdesign` CLI installs a `DESIGN.md` file containing a machine-readable design language for coding agents. The current CLI supports `npx getdesign list` and `npx getdesign add <slug>`. citeturn901233search0

## 4.2 Vercel-inspired DESIGN.md reference

Install the Vercel-inspired reference as an auxiliary design study:

```bash
npx getdesign@latest add vercel
```

The `vercel` slug is currently available and generates a Vercel-inspired `DESIGN.md`. citeturn300397search0

IMPORTANT:

This is **not** the Techily Fly design system.

Use it only for studying:

- design-token organization
- restrained layout systems
- interface rhythm
- developer/infrastructure visual conventions
- agent-readable design documentation

Do NOT copy its colors, typography, branding, or visual identity into Techily Fly.

The authoritative visual document remains:

`Techily_Fly_TF_Brand_Design_System_PRD.md`

## 4.3 DESIGN.md operating rule

If `DESIGN.md` is installed, the agent must read it before UI work, but resolve conflicts using the Techily Fly source-priority rules.

Recommended hierarchy:

1. Techily Fly Brand Design System
2. Techily Fly Website PRD
3. Techily Fly `DESIGN.md` if/when created
4. IdeaRise interaction references
5. External design studies such as Vercel `DESIGN.md`

Do not let a generic external design document override the Techily Fly brand.

---

# 5. Skills Registry / Discovery

## 5.1 skills.sh

URL:

https://www.skills.sh/

Use `skills.sh` as the primary discovery index for additional agent skills. The directory currently exposes skills across design, testing, browser automation, SEO, performance, accessibility, and other engineering workflows. citeturn560102search5

Useful command pattern:

```bash
npx skills add <repository-or-skill-url>
```

Agent rule:

> Search `skills.sh` before creating a custom skill for a common development task.

Do not blindly install every trending skill.

Evaluate:

- source/repository credibility
- maintenance activity
- security/audit signals where available
- overlap with existing skills
- compatibility with Astro/Cloudflare
- actual value to Techily Fly

---

# 6. Vercel Agent Skills — Design Review and UI QA

## 6.1 Official Vercel agent skills repository

URL:

https://github.com/vercel-labs/agent-skills

Skills directory:

https://www.skills.sh/vercel-labs/agent-skills

This repository is useful even though Techily Fly will deploy on Cloudflare, because its `web-design-guidelines` skill is a design/accessibility/UX audit tool rather than a requirement to host on Vercel. The repository documents the skill's UI audit role. citeturn560102view0L174-L178 citeturn560102search0

## 6.2 Install the Web Design Guidelines skill

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
```

Use it for:

- design QA
- accessibility review
- focus-state review
- form UX review
- animation review
- image implementation review
- navigation/state review
- responsive interaction review
- performance-related UI review

The skill currently audits 100+ interface rules spanning accessibility, focus, forms, animation, typography, images, performance, navigation/state, dark mode, touch interaction, and locale/i18n. citeturn560102view0L211-L233

## 6.3 Optional Vercel skills

Do not install Vercel deployment or React/Next-only skills just because the repository contains them.

For Techily Fly, use:

- `web-design-guidelines` — recommended

Do not make these mandatory unless the architecture later requires them:

- `deploy-to-vercel`
- `vercel-cli-with-tokens`
- `vercel-optimize`
- React/Next-specific skills

This project is Cloudflare-first and Astro-first.

---

# 7. Tailwind Agent Skills

## 7.1 Lombiq Tailwind Agent Skills

URL:

https://github.com/Lombiq/Tailwind-Agent-Skills

Purpose:

- Tailwind CSS v4 knowledge for agents
- current utility/class patterns
- Tailwind-specific implementation guidance
- documentation lookup instead of stale model memory

The repository is specifically positioned as an agent-optimized Tailwind CSS v4 documentation skill with local snapshots and indexing. citeturn560102view1

Install:

```bash
npx skills add https://github.com/Lombiq/Tailwind-Agent-Skills
```

Use when the Techily Fly project uses Tailwind CSS.

If the final implementation deliberately uses handcrafted CSS instead of Tailwind, do not force Tailwind into the stack merely because the skill is installed.

Important:

Tailwind is an implementation tool, not a replacement for the Techily Fly design system.

---

# 8. Browser Automation / Live Verification

## 8.1 Vercel Agent Browser skill

URL:

https://github.com/vercel-labs/agent-browser

Skill page:

https://www.skills.sh/vercel-labs/agent-browser

Recommended install:

```bash
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser
```

Use it for:

- opening the local site
- inspecting accessibility trees
- checking interactive controls
- testing navigation
- form interaction
- responsive browser verification
- visual/functional regression checks

The current skill provides browser automation with navigation, snapshots, interaction, extraction, and persistent sessions. citeturn252073search5turn252073search10

## 8.2 Browser verification rule

A page is not considered complete merely because the code compiles.

The agent should verify important user flows in a real browser after implementation.

Minimum checks:

- homepage navigation
- mobile menu
- mega menu
- search
- blog listing
- blog article
- contact form
- newsletter form
- admin login
- admin content edit flow
- publish/update workflow
- 404

---

# 9. Testing Skills

Use `skills.sh` to discover and install testing capabilities appropriate to the final stack.

Recommended categories include:

- webapp testing
- Playwright best practices
- browser/CLI testing
- verification-before-completion
- TDD where useful

Current skills.sh testing guidance highlights Playwright, web-app testing, TDD, and end-of-task verification skills. citeturn252073search1turn252073search13

Recommended installs when the repository supports them:

```bash
npx skills add https://github.com/obra/superpowers --skill verification-before-completion
npx skills add https://github.com/currents-dev/playwright-best-practices-skill --skill playwright-best-practices
```

Use TDD selectively for business logic and data workflows; do not add needless test ceremony to static content files.

---

# 10. Web Quality Skill Collection

## 10.1 Addy Osmani web-quality-skills

URL:

https://www.skills.sh/addyosmani/web-quality-skills

Collection:

```bash
npx skills add addyosmani/web-quality-skills
```

Useful included capabilities currently include:

- accessibility
- SEO
- performance
- web-quality-audit
- core-web-vitals
- best-practices

The collection is specifically organized around web quality concerns that map directly to this project. citeturn252073search16

Recommended use:

- final quality audits
- performance reviews
- accessibility reviews
- SEO checks
- Core Web Vitals reviews

If overlapping skills create conflicting guidance, keep the strongest project-specific rule and avoid duplicate workflows.

---

# 11. Core Astro Skills

## 3.1 Astro Agent Skills — incluud

URL:

https://github.com/incluud/astro-agent-skills

Install:

```bash
npx skills add incluud/astro-agent-skills
```

Use this for:

- Astro architecture
- Astro components
- static-first rendering
- islands/client interactions
- accessibility-aware Astro development
- current Astro development patterns

---

# 12. End-to-End Website Builder Skill

## 4.1 Website Builder — Astro + Cloudflare

URL:

https://github.com/karero/website-builder

Install:

```bash
npx skills add https://github.com/karero/website-builder
```

This skill is particularly relevant to Techily Fly because it supports an end-to-end website workflow around:

- positioning
- content structure
- web design
- frontend development
- SEO/GEO
- QA
- review
- launch
- Astro
- Cloudflare
- Google Antigravity

Use it as the broader website-production workflow, while the Techily Fly PRDs remain the project-specific authority.

---

# 13. Official Cloudflare Skills

## 5.1 Cloudflare Skills Collection

URL:

https://github.com/cloudflare/skills

Install collection:

```bash
npx skills add https://github.com/cloudflare/skills
```

Recommended core skills for this project:

```bash
npx skills add https://github.com/cloudflare/skills --skill cloudflare
npx skills add https://github.com/cloudflare/skills --skill wrangler
npx skills add https://github.com/cloudflare/skills --skill workers-best-practices
npx skills add https://github.com/cloudflare/skills --skill web-perf
```

## Required Cloudflare focus

### `cloudflare`

Use for:

- Cloudflare architecture
- platform services
- DNS/domain integration
- deployment choices
- platform constraints

### `wrangler`

Use for:

- local development
- Cloudflare deployment
- configuration
- migrations
- environment management
- CLI workflows

### `workers-best-practices`

Use for:

- efficient Workers architecture
- request handling
- runtime efficiency
- production reliability

### `web-perf`

Use for:

- Core Web Vitals
- LCP
- INP
- CLS
- TTFB
- caching
- render-blocking resources
- asset optimization
- Cloudflare-specific performance practices

---

# 14. Frontend Design / Visual Quality Skills

## 6.1 Antigravity Skills Library

URL:

https://antigravityskills.com/

Look for and install/use:

- Frontend Design Skill
- Impeccable Skill

These skills should be used for:

- high-quality visual composition
- polished responsive UI
- spacing and hierarchy
- interaction quality
- visual review
- avoiding generic template-style layouts

Important:

The Techily Fly Brand Design System remains the authority for:

- colors
- fonts
- typography hierarchy
- spacing tokens
- radius
- accessibility
- animation philosophy
- component consistency

Do not allow generic AI/SaaS styling from these skills to override the Techily Fly design system.

---

# 15. Astro SEO Skill

## 7.1 jdevalk Skills

URL:

https://github.com/jdevalk/skills

Install:

```bash
npx skills add https://github.com/jdevalk/skills
```

Use the `astro-seo` capability for:

- metadata
- title management
- canonical URLs
- Open Graph
- Twitter/X metadata
- JSON-LD
- structured data
- sitemap
- robots
- redirects
- content collections
- SEO validation
- search-engine discoverability

---

# 16. Google Modern Web Guidance

Google Antigravity documentation:

https://antigravity.google/docs/build-with-google

Use the Modern Web Guidance capabilities where available.

Target areas:

- accessibility
- performance
- security
- modern web development
- production quality

---

# 17. Optional / Situational Cloudflare Skills

The official Cloudflare skill collection contains many specialized capabilities.

Do not automatically make every Cloudflare skill mandatory.

Avoid adding unnecessary project complexity from specialized skills such as:

```text
agents-sdk
durable-objects
sandbox-sdk
sandbox-next
building-ai-agent-on-cloudflare
building-mcp-server-on-cloudflare
cloudflare-one
cloudflare-one-migrations
```

Only install these when a real Techily Fly requirement needs them.

---

# 18. Recommended Skill Stack

The preferred stack is:

```text
TECHILY FLY AGENT
│
├── BRAND / UX
│   ├── Techily Fly Brand Design System
│   ├── Frontend Design Skill
│   └── Impeccable Skill
│
├── ASTRO
│   ├── Astro Agent Skills
│   ├── Astro components
│   ├── static-first rendering
│   └── islands/client interactions
│
├── CLOUDFLARE
│   ├── Cloudflare
│   ├── Wrangler
│   ├── Workers Best Practices
│   └── Web Performance
│
├── SEO / DISCOVERY
│   └── Astro SEO
│
├── WEB QUALITY
│   ├── Accessibility
│   ├── Core Web Vitals
│   ├── Security
│   └── QA / testing
│
└── DEPLOYMENT
    ├── GitHub
    └── Cloudflare
```

---

# 19. Recommended One-Time Install Commands


## 19.1 Bootstrap commands

Run from the parent directory where the repository should be created:

```bash
npm create astro@latest
```

Then enter the project directory and install project skills.

## 19.2 Recommended one-time skill installation

```bash
# Core Astro
npx skills add incluud/astro-agent-skills

# End-to-end website workflow
npx skills add https://github.com/karero/website-builder

# Cloudflare
npx skills add https://github.com/cloudflare/skills --skill cloudflare
npx skills add https://github.com/cloudflare/skills --skill wrangler
npx skills add https://github.com/cloudflare/skills --skill workers-best-practices
npx skills add https://github.com/cloudflare/skills --skill web-perf

# Astro SEO
npx skills add https://github.com/jdevalk/skills

# UI/design audit
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines

# Tailwind v4 agent knowledge (only if Tailwind is used)
npx skills add https://github.com/Lombiq/Tailwind-Agent-Skills

# Browser automation / live verification
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser

# Verification and testing
npx skills add https://github.com/obra/superpowers --skill verification-before-completion
npx skills add https://github.com/currents-dev/playwright-best-practices-skill --skill playwright-best-practices

# Web quality collection
npx skills add addyosmani/web-quality-skills

# Optional design study
npx getdesign@latest add vercel
```

Before using optional skills, verify that they are still appropriate and maintained.

## 19.3 Skill discovery commands

```bash
# Discover available skills
npx skills find

# Search the public skills directory
# https://www.skills.sh/

# Inspect available DESIGN.md templates
npx getdesign list
```

Do not treat `npx getdesign@latest add vercel` as the Techily Fly design system. It creates a Vercel-inspired reference only. citeturn300397search0

Use section **19.2** as the canonical installation block.

For Antigravity-native design skills, use the current catalog at:

https://antigravityskills.com/

For Google guidance, use:

https://antigravity.google/docs/build-with-google

---

# 20. Techily Fly Project Agent Rules

The agent must follow these rules on every task.

## 20.1 Architecture

- Astro-first
- PHP is forbidden
- Prefer static rendering
- Use client-side JavaScript only when interaction requires it
- Avoid unnecessary JavaScript bundles
- Prefer serverless/edge services
- Prefer Cloudflare services
- Prefer free tiers and open-source/free tooling
- Keep vendor lock-in as low as practical
- Keep content and configuration manageable through the admin panel

## 20.2 Performance

- Optimize for Core Web Vitals
- Minimize JavaScript
- Use Astro static generation wherever possible
- Lazy-load non-critical media
- Optimize images
- Avoid render-blocking scripts
- Use modern image formats where appropriate
- Use Cloudflare caching correctly
- Keep third-party scripts controlled
- Load analytics/ads only where needed
- Use progressive enhancement
- Respect reduced-motion preferences

## 20.3 SEO

Every public page must support:

- unique title
- meta description
- canonical URL
- Open Graph metadata
- Twitter/X metadata where appropriate
- structured data when appropriate
- sitemap inclusion controls
- robots/index controls
- optimized headings
- internal linking
- semantic HTML
- breadcrumbs where appropriate
- image alt text
- SEO-friendly slugs

---

# 21. Techily Fly Brand Rules

## Primary colors

```text
TF Graphite      #212121
Signal Coral     #FF7759
Cloud Surface    #FAFAFA
```

## Supporting tokens

```text
Graphite 800     #424242
Graphite 600     #757575
Graphite 300     #BDBDBD
Graphite 100     #EAEAEA
Coral Strong     #E85F45
Success          #16A394
Warning          #F4B740
Error            #E5484D
Info             #5B7CFA
```

## Typography

```text
Manrope
Geist Mono
```

### Manrope

Use for:

- brand
- headings
- body
- navigation
- UI
- buttons
- forms
- dashboards
- marketing pages

### Geist Mono

Use for:

- code
- API examples
- model names
- versions
- IDs
- hashes
- logs
- technical metrics
- machine/system states

No other font should be introduced.

---

# 22. Forbidden Design Behavior

The agent must NOT introduce:

- random fonts
- random hex colors
- purple/blue generic AI gradients
- neon palettes
- excessive glow
- excessive glassmorphism
- arbitrary shadow systems
- inconsistent border radii
- unrelated visual styles
- duplicate component systems
- color-only status communication
- accessibility-hostile interactions

Signal Coral is an accent/action signal, not a universal background or text color.

---

# 23. IdeaRise Interaction Direction

Use IdeaRise as a reference for **interaction language and layout ideas**, not brand identity.

The IdeaRise source demonstrates:

- dark immersive hero composition
- animated navigation
- 3D canvas scenes
- particle systems
- matrix-rain background treatment
- typewriter-style hero content
- glass/dark cards
- hover depth / scale interactions
- animated sections
- service/capability cards
- process storytelling
- testimonials
- client/brand presentation
- case studies
- strong CTA sections
- responsive mobile navigation

The implementation must translate those behaviors into Techily Fly's visual system.

For example:

- IdeaRise blue accents → Signal Coral
- IdeaRise typography → Manrope / Geist Mono
- IdeaRise generic dark palette → TF Graphite / approved neutral tokens
- IdeaRise glass treatment → restrained Techily Fly surfaces and borders
- IdeaRise decorative effects → controlled, purposeful motion only

Do not copy IdeaRise's branding, logo, colors, or identity.

---

# 24. Techily Fly Website Requirements

The public website must include, where applicable:

- Home
- About
- Ecosystem
- Businesses / Brands
- Individual brand/business pages
- Services
- Service detail pages
- Solutions
- Industries/use cases
- Case studies
- Testimonials
- Clients/partners
- Process
- Blog
- Blog categories
- Blog tags
- Search
- Authors
- Author profiles
- Contact
- FAQ
- Newsletter
- Privacy Policy
- Terms of Service
- Cookie/Consent information
- Disclaimer
- Advertising/AdSense-related information
- Accessibility page or statement where appropriate
- 404
- 500/error handling
- Sitemap
- robots.txt
- ads.txt

Additional pages should be created when required by the final PRD or content model.

---

# 25. Admin Panel Requirements

The complete website must be manageable from the admin panel.

Admin content controls should cover:

- pages
- navigation
- mega menus
- hero content
- sections
- services
- service categories
- ecosystem brands
- testimonials
- clients
- case studies
- FAQs
- blog posts
- authors
- categories
- tags
- media
- redirects
- SEO metadata
- social metadata
- schema settings
- newsletter subscribers
- contact submissions
- form settings
- ad placements
- AdSense configuration
- announcement bars
- site settings
- footer
- legal pages
- cookie/consent settings
- analytics IDs
- scripts/code snippets
- robots rules
- sitemap controls
- maintenance mode

Admin UI must follow the same Techily Fly design system.

---

# 26. Content Architecture

Content should be modeled so that the public website can remain static-first while content is controlled through the admin/CMS layer.

Recommended entities:

```text
SiteSettings
Navigation
Page
Section
Brand
Service
ServiceCategory
CaseStudy
Testimonial
Client
FAQ
BlogPost
Author
Category
Tag
MediaAsset
ContactSubmission
NewsletterSubscriber
Redirect
AdSlot
AdConfiguration
SEOSetting
LegalDocument
Announcement
```

Use reusable structured content rather than hardcoding repeated content into individual page templates.

---

# 27. Monetization / Google AdSense Readiness

The site must be designed for legitimate Google AdSense monetization.

Provide:

- clear content hierarchy
- substantial original content
- useful blog/article pages
- strong navigation
- privacy policy
- terms
- cookie/consent handling as applicable
- contact information
- author information
- transparent site ownership
- responsive layout
- controlled ad placements
- no accidental ad-click patterns
- configurable ad components
- mobile-safe ad placements
- ad slot enable/disable controls
- ads.txt support
- admin-controlled publisher settings

Important:

AdSense eligibility and approval are determined by Google. The implementation must be AdSense-ready but must never claim guaranteed approval.

Do not auto-populate fake content solely for monetization.

---

# 28. Cloudflare-First Infrastructure

Preferred production platform:

```text
GitHub
   ↓
Astro
   ↓
Cloudflare
```

Use Cloudflare services only where they provide a practical benefit.

Preferred areas:

- CDN/cache
- DNS
- Pages/Workers deployment
- D1 for relational content where appropriate
- R2 for media where appropriate
- Turnstile for spam protection
- Workers for dynamic edge operations
- caching rules
- security controls

Avoid PHP hosting.

---

# 29. Reliability Requirements

The agent should design for:

- static fallback where possible
- graceful failures
- retries only when safe
- form validation
- spam protection
- rate limiting where necessary
- safe error handling
- reliable migrations
- version-controlled configuration
- backups/export strategies for important content
- observability/logging without excessive overhead

---

# 30. Accessibility Requirements

Target WCAG AA.

Verify:

- keyboard navigation
- visible focus states
- semantic HTML
- labels for form inputs
- accessible names for controls
- sufficient contrast
- alt text
- screen-reader compatibility
- reduced-motion support
- errors are not communicated only through color
- status has text/icon in addition to color
- touch targets are usable

---

# 31. Motion Rules

Motion must reinforce understanding.

Use animation for:

- navigation continuity
- state transitions
- hero storytelling
- section reveals
- hover feedback
- loading/processing feedback
- controlled 3D/particle visuals

Avoid:

- continuous motion that distracts from reading
- heavy animations on low-power devices
- motion that harms performance
- mandatory animation

Always support:

```css
@media (prefers-reduced-motion: reduce) {
  /* reduce or disable non-essential animation */
}
```

---

# 32. Component Architecture

Build reusable primitives first.

Recommended primitives:

- Button
- LinkButton
- Input
- Textarea
- Select
- Card
- Badge
- SectionHeader
- Container
- Grid
- Modal
- Drawer
- Tabs
- Accordion
- Breadcrumbs
- Pagination
- SearchBox
- AdSlot
- ArticleCard
- TestimonialCard
- BrandCard
- ServiceCard
- CaseStudyCard
- CTA
- Navbar
- MegaMenu
- Footer

Reuse components instead of creating duplicates.

---

# 33. Admin Development Principles

The admin panel should prioritize:

1. speed of comprehension
2. predictable navigation
3. fast editing
4. safe publishing
5. content previews
6. autosave/draft behavior where appropriate
7. role-based permissions
8. validation
9. media reuse
10. SEO controls

Recommended lifecycle:

```text
Draft
  ↓
Review
  ↓
Scheduled / Approved
  ↓
Published
  ↓
Archived
```

---

# 34. Quality Gate Before Completion

The agent must not declare the website complete until these are checked:

- [ ] Brand system followed
- [ ] Only Manrope and Geist Mono used
- [ ] Approved colors only
- [ ] No PHP
- [ ] Astro-first architecture
- [ ] Cloudflare deployment works
- [ ] Admin panel works
- [ ] All major pages work
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Keyboard navigation works
- [ ] Focus states work
- [ ] Reduced motion works
- [ ] Images optimized
- [ ] Core Web Vitals reviewed
- [ ] SEO metadata reviewed
- [ ] Structured data reviewed
- [ ] Sitemap works
- [ ] robots.txt works
- [ ] ads.txt works
- [ ] Legal pages exist
- [ ] Contact flow works
- [ ] Newsletter flow works
- [ ] Search works
- [ ] 404 works
- [ ] Error handling works
- [ ] Ad slots are configurable
- [ ] Analytics is configurable
- [ ] Cloudflare caching/security reviewed
- [ ] No unnecessary third-party scripts
- [ ] No console errors in production
- [ ] No broken internal links
- [ ] No duplicate component systems

---

# 35. Agent Operating Instruction

Use this as a project-level instruction:

```text
You are the Techily Fly website engineering and design agent.

Your primary goal is to build a premium, fast, accessible, SEO-friendly, AdSense-ready, fully admin-manageable website and web platform for Techily Fly.

AUTHORITATIVE SOURCES:
1. Techily_Fly_TF_Brand_Design_System_PRD.md
2. Techily_Fly_Complete_Website_PRD.md
3. Existing Techily Fly content
4. IdeaRise interaction/layout source

Use IdeaRise for interaction inspiration and information architecture patterns only.
Do not copy IdeaRise branding.

TECH STACK:
- Astro
- TypeScript where appropriate
- Cloudflare
- GitHub
- D1/R2/Workers only where useful
- No PHP

DESIGN:
- TF Graphite #212121
- Signal Coral #FF7759
- Cloud Surface #FAFAFA
- Manrope for human-facing UI
- Geist Mono for technical/system contexts

Never introduce random colors, fonts, gradients, neon styling, or inconsistent visual patterns.

PERFORMANCE:
Prefer static output and minimal JavaScript.
Optimize images, caching, Core Web Vitals and third-party scripts.

UX:
Use clear hierarchy, purposeful motion, polished responsive layouts, excellent accessibility and restrained premium visual effects.

CONTENT:
Keep Techily Fly content editable from the admin panel.
Do not hardcode content that should be managed by administrators.

SEO:
Every public page should have complete SEO controls and appropriate structured data.

MONETIZATION:
Make the site AdSense-ready with appropriate legal/content/ad infrastructure without claiming approval guarantees.

ADMIN:
Every important public-site setting should be controllable from the admin panel.

QUALITY:
Before completion, inspect responsive behavior, accessibility, performance, SEO, security, internal links, forms, error handling and deployment.

When uncertain, prefer the existing Techily Fly pattern and PRD instead of inventing a new one.
```

---

# 36. Final Installation Checklist

```text
[ ] Run npm create astro@latest
[ ] Read Astro official setup documentation
[ ] Read Astro Build with AI guidance
[ ] Enable current Astro documentation/MCP access when supported

[ ] Install Astro Agent Skills
[ ] Install Website Builder skill
[ ] Install Cloudflare skill
[ ] Install Wrangler skill
[ ] Install Workers Best Practices skill
[ ] Install Web Performance skill
[ ] Install Astro SEO skill

[ ] Install Vercel web-design-guidelines skill
[ ] Install Vercel agent-browser skill
[ ] Install Tailwind Agent Skills if Tailwind is used
[ ] Install verification-before-completion
[ ] Install Playwright best practices
[ ] Install web-quality-skills collection

[ ] Run npx getdesign@latest list
[ ] Add Vercel DESIGN.md reference with npx getdesign@latest add vercel
[ ] Review DESIGN.md but keep Techily Fly PRD as visual authority

[ ] Review skills.sh for additional project-specific skills
[ ] Add Techily Fly project PRDs
[ ] Add this file to the project
[ ] Configure GitHub repository
[ ] Configure Cloudflare
[ ] Configure environment variables
[ ] Configure content/admin architecture
[ ] Configure SEO and structured-data system
[ ] Configure AdSense/ads.txt infrastructure
[ ] Configure Turnstile/form protection where required
[ ] Run initial skill validation
[ ] Run build
[ ] Run browser verification
[ ] Run accessibility checks
[ ] Run SEO checks
[ ] Run performance checks
[ ] Run Core Web Vitals checks
[ ] Run production deployment checks
```

---

# 37. Important URLs

## Agent / Design / Quality URLs

- Skills registry: https://www.skills.sh/
- getdesign: https://getdesign.md/
- getdesign Vercel analysis: https://getdesign.md/vercel/design-md
- Vercel Agent Skills: https://github.com/vercel-labs/agent-skills
- Vercel Web Design Guidelines skill: https://www.skills.sh/vercel-labs/agent-skills/web-design-guidelines
- Lombiq Tailwind Agent Skills: https://github.com/Lombiq/Tailwind-Agent-Skills
- Vercel agent-browser: https://github.com/vercel-labs/agent-browser
- Web quality skills: https://www.skills.sh/addyosmani/web-quality-skills
- Testing skills directory: https://www.skills.sh/topic/testing


## Astro

https://astro.build/

## Astro Agent Skills

https://github.com/incluud/astro-agent-skills

## Website Builder

https://github.com/karero/website-builder

## Cloudflare Skills

https://github.com/cloudflare/skills

## Astro SEO Skills

https://github.com/jdevalk/skills

## Antigravity Skills

https://antigravityskills.com/

## Google Antigravity / Modern Web Guidance

https://antigravity.google/docs/build-with-google

## Skills CLI / Registry

https://skills.sh/

---

# 38. Final Rule

**Do not optimize for installing the maximum number of skills. Optimize for the smallest set of high-quality skills that gives the Techily Fly agent strong coverage of design, Astro, Cloudflare, SEO, accessibility, performance, security, QA and deployment.**

The Techily Fly PRDs remain the source of truth for the actual product.
