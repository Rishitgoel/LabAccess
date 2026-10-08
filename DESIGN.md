# LabAccess — Warm Modern UI Design

**Status:** implemented locally through Phase 6; responsive, keyboard, contrast, and reduced-motion checks recorded in [verification](docs/verification.md). Full-motion visual acceptance remains open.
**Selected reference:** [sample-ui.png](sample-ui.png).  
**Production artwork:** [assets/labaccess-hero.png](assets/labaccess-hero.png).  
**All page references:** [docs/UI_REFERENCE_GUIDE.md](docs/UI_REFERENCE_GUIDE.md).  
**Product contract:** [PRD.md](PRD.md).

## 1. Visual direction

Use warm white and sand beige with charcoal typography and restrained olive accents. The result should feel like a contemporary, polished AI-assisted startup website: spacious, editorial, rounded, and calm.

The selected resource-catalog mockup replaces the earlier indigo/sidebar direction. Use horizontal navigation throughout the application. The sample is a static visual concept, not proof of implemented components or animations.

## 2. React implementation choices

- **React + Vite:** application and build tooling.
- **Tailwind CSS:** styling and shared design tokens.
- **shadcn/ui:** customized Button, Card, Badge, Dialog, Input, Textarea, Tabs, Select, DropdownMenu, Skeleton, and Alert components. Select accessible primitives for keyboard/focus behavior.
- **Motion for React:** entrances, layout changes, card hover, active-filter movement, and dialog transitions.
- **Lucide React:** consistent resource and navigation icons.
- **React Router:** resources, requests, review queue, details, and authentication routes.

Use one animation library. Avoid extra component libraries for effects that CSS or Motion already handles.

References: [shadcn/ui](https://ui.shadcn.com/), [Motion for React](https://motion.dev/docs/react).

## 3. Design tokens

| Token | Value | Purpose |
|---|---|---|
| Page background | `#FFFEFC` | Warm white canvas |
| Soft surface | `#F1EBE1` | Hero, icon tiles, unselected chips |
| Card surface | `#FFFFFF` | Forms and resource cards |
| Border | `#DED6CA` | Quiet card/input separators |
| Primary text | `#292922` | Headings, body, main actions |
| Secondary text | `#67645C` | Descriptions and metadata |
| Olive | `#555D42` | Brand icon, selected navigation |
| Approved background/text | `#E8EFDF` / `#37452C` | Approved status |
| Pending background/text | `#FFF1D9` / `#85500B` | Pending status |
| Rejected background/text | `#FBE8E3` / `#913B30` | Rejected status |
| Cancelled background/text | `#EEECE8` / `#59564F` | Cancelled status |

Verify actual text/background contrast during implementation, particularly muted text and status badges. These values are starting tokens, not certified contrast results.

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px. Card radius 16–20px; hero radius 24px; controls 10–12px; chips fully rounded. Use subtle shadows on hover/dialogs, not heavy shadows everywhere.

## 4. Typography

- Editorial serif, such as DM Serif Display, for the brand, catalog hero, and prominent page headings.
- Clean sans serif, such as Inter, for body, navigation, forms, and tables.
- Hero heading: approximately 64–72px desktop, 36–44px mobile.
- Page heading: 30–36px; card heading: 20–22px.
- Body: 15–16px; metadata: 12–14px.
- Keep functional controls legible; reserve uppercase letter spacing for short category labels.
- Limit font weights and provide system fallbacks.

## 5. Resource page layout

### Header

Height around 72px. Brand/olive monogram on the left; Resources and My requests centered; compact profile menu on the right. Selected navigation uses an olive underline and/or dot. Reviewer navigation uses Resources and Review queue.

### Hero

Wide beige panel with generous padding. Left: small label “YOUR LEARNING WORKSPACE,” headline “Your next skill starts here.”, supporting text, and “View my requests” action. Right: decorative cream arches and olive sphere.

Use the clean [labaccess-hero.png](assets/labaccess-hero.png) artwork for the hero and decorative authentication panels. Follow [assets/README.md](assets/README.md) for runtime placement and sizing. Treat the artwork as decorative with empty alt text; do not use the full screenshot as the page background. The catalog hero is not repeated over transactional screens.

### Catalog controls

“Explore resources” heading and resource count. Optional search on the right and optional category pills below. Search/category filtering remains optional under the PRD; the screenshot must not force scope expansion or nonfunctional controls.

### Resource grid

Three columns desktop, two tablet, one mobile. Each card has a beige icon tile, category, title, short description, eligibility detail where useful, and bottom action/status.

- No request: “Request access.”
- Pending: amber “Pending review” plus “View request.”
- Approved: olive “Approved” plus “View request.”
- Rejected/cancelled: status plus “View request”; resubmission happens in details.

Align card actions consistently. Status labels are informational badges, not disabled buttons masquerading as actions.

## 6. Remaining pages

### My requests

Reuse header/tokens. Use a modest title, status filters, and a white request table with resource, status, submitted time, latest update, and View details. On mobile, convert rows to stacked cards. No decorative hero above the list.

### Review queue

Default to pending, oldest first. Rows show learner, resource, time, status, and Review request. Include pagination when necessary. Keep decisions on details rather than inline in the queue.

### Request details

Back link, resource heading, and status badge. Desktop two columns: request context/history on the left, action panel on the right. Learners see permitted cancel/resubmit controls; reviewers see a decision reason and approve/reject. Mobile stacks context before actions.

### Request dialog

Resource summary, labelled reason textarea, character guidance, inline validation, and Submit/Cancel. Preserve text on failure. Use a full-height mobile sheet only if it remains simple and accessible.

### Authentication

Centered compact white card on the warm background with restrained beige artwork or brand detail. Clearly separate login and registration. No role picker during signup.

## 7. Component organization

Suggested components:

- `AppShell`, `AppHeader`, `ProfileMenu`.
- `PageHeading`, `CatalogHero`, `ResourceCard`, `ResourceGrid`.
- `CategoryFilters`, `StatusFilters`, `StatusBadge`.
- `RequestFormDialog`, `RequestList`, `ReviewQueue`.
- `RequestContext`, `RequestTimeline`, `DecisionPanel`.
- `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`.

Share primitives and status presentation. Keep server data and permissions authoritative; animations must not determine business state.

## 8. Motion specification

| Interaction | Motion | Timing |
|---|---|---|
| Initial content | Fade in + rise 12px | 350ms; cards stagger 60ms |
| Card hover | Lift 4px, soft shadow | 180ms |
| Button press | Scale to 0.98 | 100ms |
| Active filter | Sliding pill/highlight | 220ms |
| Filter results | Small layout transition + fade | 220–280ms |
| Dialog open/close | Fade + scale 0.98 → 1 | 180–220ms |
| Confirmed status update | Brief fade/layout change | 180ms |

Use transforms and opacity for movement. Avoid autoplaying decorative loops, excessive stagger delays, and movement that blocks reading or interaction. Cap grid entrance delays so content remains usable.

Honor `prefers-reduced-motion` through Motion's reduced-motion support: remove travel/scale/stagger and use immediate or brief opacity changes. Manage focus in dialogs independently of animation.

## 9. Responsive and accessible behavior

- Test at approximately 375px, 768px, and 1440px widths.
- Use a centered content container, roughly 1440px maximum, with 20–40px side padding.
- Collapse decorative hero artwork on narrow screens; retain useful content and actions.
- Collapse navigation into a small accessible menu when needed.
- Inputs/actions remain comfortably touchable, approximately 44px minimum height.
- Provide keyboard navigation, visible olive focus rings, associated labels, and meaningful button text.
- Status text/icons complement color.
- Announce errors and successful actions accessibly.

## 10. Loading, empty, and error states

- Skeletons should match the final card/table structure to reduce layout shifts.
- Empty lists explain why and offer a relevant next action.
- Failed reads show a concise message and retry action.
- Failed forms preserve content and identify the affected fields.
- Success feedback appears only after confirmed persistence.
- A conflicting reviewer action explains that the request changed and refreshes its details.

## 11. Design acceptance

- White/beige theme and horizontal navigation consistent across pages.
- Resource page recognizably follows the sample without copying screenshot pixels into the UI.
- Every visible control has implemented behavior or is omitted.
- Role-specific navigation/actions follow the PRD.
- No horizontal overflow on mobile.
- Keyboard/focus, contrast, and reduced-motion behavior checked.
- Animation smooth on tested devices and does not delay the primary workflow.
- Empty/error/loading states reviewed alongside successful states.

## 12. Reference provenance

`sample-ui.png` was generated with the built-in image tool as an imagination/reference page. It contains illustrative synthetic content. It does not establish that React libraries, motion, or product workflows have been implemented.

Prompt summary: one high-fidelity LabAccess learner resource-catalog page, warm white/sand beige surfaces, charcoal/olive palette, editorial serif headings, horizontal navigation, cream arches, six resource cards, approval/pending badges, optional search/category controls, and a layout suitable for subtle Motion transitions.

## 13. Page reference set and visual consistency

The [page reference guide](docs/UI_REFERENCE_GUIDE.md) contains twelve images: the existing catalog plus login, registration, request dialog, learner list, pending details, rejected/resubmit details, reviewer queue, reviewer decision details, approved details, access denied, and not found.

Use each image during its linked implementation phase. Compare a browser screenshot afterward. The references share one theme; do not create independent page palettes, sidebars, duplicate request-detail implementations, or additional product features.

Written tokens, typography scales, accessibility rules, and PRD behavior take precedence over generated image details. Dynamic character counts, sample IDs, people, and dates are illustrative. Optional search/filter controls in the catalog remain optional. Cancelled requests and completed reviewer decisions are variants of the existing detail layouts, as described in the guide.

Auth artwork may reuse the catalog's decorative language; other transactional pages remain focused on forms, requests, and history. All images are static concept references, not implemented screenshots or animation evidence. Exact prompts are in [docs/UI_REFERENCE_PROMPTS.md](docs/UI_REFERENCE_PROMPTS.md).
