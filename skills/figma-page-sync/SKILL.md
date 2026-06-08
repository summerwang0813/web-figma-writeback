---
name: figma-page-sync
description: "Write generated or implemented websites back to Figma with exact visual and semantic fidelity. Use when the user says figma-page-writeback, figma-page-sync, sync to Figma, write website to Figma, push current webpage into Figma, or asks to keep any website, landing page, ecommerce page, dashboard, tool, or generated web app aligned with Figma while reusing design-system components, variables, typography, colors, icons, images, and screenshots."
---

# Figma Page Sync

Use this skill to write any generated or implemented website back into Figma and keep the Figma source aligned with the real webpage. The primary direction is:

- **Website to Figma**: the running webpage is source of truth; capture the real DOM/CSS/layout and write it into Figma using the target file's component library, variables, typography, colors, icons, and reusable patterns.

This skill is website-agnostic. Do not assume the current project is the product name or the final repository name. It should work for any site: product pages, landing pages, ecommerce flows, dashboards, SaaS tools, portfolios, and generated prototypes.

If the user explicitly says "同步到网页" or "同步到代码", inspect Figma and update the website code as a secondary workflow. Otherwise default to Website to Figma.

## Required Tooling

- For webpage capture and verification, use the Browser skill with the in-app browser.
- For Figma writes, load `figma:figma-use` before every `use_figma` call.
- For full-page Figma generation/writeback, also load `figma:figma-generate-design`.
- Search and reuse the target Figma file's design-system components, styles, and variables before creating anything.
- If the target file has no usable component library or variables, create a fallback design-system foundation before writing the page.
- If a needed color, text style, spacing token, or component variant is missing, create or extend the design system first, then bind page nodes to it.
- Variables are mandatory for reusable design values. If variables exist, reuse matching variables first. A match requires both semantic role and resolved hex value to match the captured CSS color; do not bind a card/surface/module fill to a page-background variable just because the name looks close. If the file has no variables, create the fallback variable collections first. If variables exist but a required color is missing or a similar variable resolves to a different color, create the missing color variable with a trailing `*` in its name, then bind the node to it.

## Editable Writeback Contract

The Figma output must be an editable design, not a screenshot archive.

- Final page/state frames must be built from semantic Figma nodes: frames, auto-layout groups, text nodes, component instances, vectors/SVG icons, and image fills only where the webpage itself uses an image.
- Do not use a full-page screenshot, single image rectangle, or screenshot component instance as the primary page body.
- Screenshots are allowed only as locked reference layers, comparison artifacts, or temporary assets during verification. Name them `Reference Screenshot` and keep them separate from the editable module tree.
- Product photos, hero photos, backgrounds, thumbnails, and other real webpage images may use image fills. UI chrome, text, buttons, forms, cards, navigation, tables, and order states must be editable nodes or component instances.
- If a component cannot be reproduced editably with current information, stop and report the blocker instead of falling back to a full-page screenshot.

Before writing any page modules, run the design-system preflight script from `scripts/figma-design-system-preflight.js` through `use_figma` and use its output to create a writeback plan:

1. Existing variables/styles/components that will be reused.
2. Missing tokens/components that must be created in the fallback foundation.
3. Component-role mapping for navigation, buttons, inputs, selectors, cards, tabs, badges, modals, tables, icons, and ecommerce/order controls.
4. Asset map for real webpage images only.

Components named `web-figma-writeback/assets/...`, `Reference Screenshot`, or similar screenshot/reference names are asset/reference components, not reusable UI components. Do not count them as the component library.

After writing modules, run `scripts/figma-editable-output-audit.js`. A sync is not complete if the audit reports large screenshot/image nodes standing in for whole pages or modules.

## Fallback Design System

When the Figma file does not already have a usable component library, create variables and text styles in this order:

1. `01 Base`: primitive colors, neutral ramps, brand ramps, radius primitives, and raw numeric values.
2. `02 Semantic`: semantic aliases for background, surface, title text, body text, muted text, border, primary action, warning, success, danger, and disabled states.
3. `03 Spacing`: spacing, gap, padding, container width, section spacing, radius, and control height tokens.
4. `04 Typography`: reusable typography tokens and callable text styles.

Typography must be reusable, not hardcoded per text layer. Create Figma text styles such as `04 Typography/Display/H1`, `04 Typography/Title/H2`, `04 Typography/Body/Regular`, `04 Typography/Button/Primary`, and apply those styles to text nodes. Where the Figma API supports variable binding for typography values, also create numeric/string variables for font family, font size, line height, font weight, and letter spacing; otherwise the text styles are the callable typography surface.

When the target Figma file already has text styles, use those first. A final text node is not complete until `textStyleId` points to an existing local or library Text Style. Copying `fontName`, `fontSize`, `fontWeight`, or `lineHeight` from CSS is only an intermediate matching step; it is not enough for final writeback.

If the webpage uses an exact typography value that does not exist in the target file, create a new Text Style with a trailing `*` in the style name, such as `Web / Coupon / Title*`. The `*` marks styles added by this sync and keeps them visually distinct from the original component-library styles.

## Website To Figma

1. Capture the running route before writing anything.
   - Save a viewport screenshot.
   - Capture DOM section bounds, text bounds, image bounds, CSS variables, fixed/sticky elements, and scroll height.
   - Use `scripts/browser-page-capture.js` as the browser-side capture snippet when useful.
   - Prefer H2D-style fidelity checks: use captured `visibleRect`, `clippingAncestors`, `zIndex`, `overflow`, `objectFit`, and `objectPosition` when placing images, clipped media, sticky bars, dropdowns, and overlays. Do not place images from raw bounding boxes when the source is clipped by a parent.
   - Treat screenshots as verification references only, not as final editable output.

2. Split the page into semantic modules.
   - Top-level Figma frames should match webpage modules such as `Header`, `Hero`, `Product Gallery`, `Checkout Summary`, `Payment Detail`, `Order List`.
   - Do not merge unrelated modules into one frame.

3. Prepare component-library references, tokens, and assets.
   - Search Figma libraries first.
   - Run `scripts/figma-design-system-preflight.js` and summarize the existing components, variables, styles, and gaps.
   - Import matching component instances from the component library when available.
   - If no component library exists, create the fallback `01 Base / 02 Semantic / 03 Spacing / 04 Typography` system first.
   - Bind fills, strokes, and text colors to variables. If a matching variable exists, use it. Matching means the variable's role and resolved hex both match the captured CSS color. If no variables exist, create fallback variables first. If variables exist but the needed color is missing, or a nearby variable such as `bg/page` resolves to the wrong color for a `surface`/card/module fill, create a semantic color variable with `*` at the end of its name, then bind to it.
   - Text fills must bind to `TEXT_FILL` color variables such as semantic `text/title`, `text/default`, `text/body`, `text/muted`, `text/white`, `action/primary`, and state colors. A raw solid color on a final text layer is not complete.
   - Bind typography to text styles; do not leave repeated font settings as one-off layer properties.
   - Resolve each captured text block to a semantic Text Style before writing: brand mark, H1/H2, section title, card title, body, caption, label, badge/status, link, price, gallery arrow, and button label.
   - Create missing variables in the correct fallback layer only when the library lacks the required value.
   - Upload webpage images to Figma and map each `src` to an `imageHash`.

4. Write incrementally.
   - Create or update the page frame at the real webpage width, commonly `1440`.
   - Keep content width, gutters, grid gaps, radii, shadows, and states from the captured page.
   - Write one module at a time and return concise IDs and coordinates after each module.

5. Verify after every meaningful write.
   - Read Figma node positions back.
   - Compare against captured webpage layout.
   - Pull a Figma screenshot and visually inspect for image drift, button padding, icon alignment, text wrapping, shadows, and accidental selected states.

## Optional Figma To Website

1. Inspect the target Figma frame.
   - Use Figma metadata, design context, variables, and screenshot.
   - Identify frame width, content width, module names, text styles, fills, strokes, radii, effects, images, and states.

2. Map Figma nodes to code ownership.
   - Find the route, component, CSS file, and asset paths that render the matching webpage.
   - Reuse existing code patterns and design tokens instead of adding one-off styles.

3. Patch code in small, traceable steps.
   - Update structure only when the Figma hierarchy requires it.
   - Update spacing, typography, colors, shadows, and image treatment to match the design.
   - Keep ecommerce state logic and order flow behavior intact unless the Figma change explicitly changes behavior.

4. Run and verify the webpage.
   - Start or reuse the local dev server.
   - Open the route in Browser, refresh, and capture a screenshot.
   - Compare the webpage screenshot and layout to the Figma source.

5. Optionally write back.
   - If the user wants both sides aligned after code changes, run the Website to Figma workflow again.

## Hard Rules

- Never redraw from memory. Always capture or inspect the current source of truth first.
- Do not build page-specific one-off colors, fonts, or controls when the Figma component library has a matching asset.
- Do not use a screenshot or image component as the final editable page/module. Full-page screenshots belong only in reference layers or verification artifacts.
- Do not write a page into a file with no design-system foundation; create `01 Base`, `02 Semantic`, `03 Spacing`, and `04 Typography` first.
- Do not leave final fills or strokes as raw solid colors. All solid text fills, shape fills, frame fills, and strokes must bind to color variables. Missing color variables created during sync must end with `*`.
- Do not hardcode typography on repeated text nodes; create callable text styles and apply them.
- Do not leave final `TEXT` nodes without `textStyleId`. If the component library has a matching Text Style, bind it; if not, create the missing `04 Typography/...` style and bind it before completion.
- Do not leave final text fills as raw solid colors. Every solid text fill must be bound to an existing color variable; create a missing semantic text color variable only when the file lacks a match.
- Do not create unmarked new typography. Any newly created Text Style must end with `*`; existing component-library Text Styles keep their original names.
- Do not treat the current website's product/project name as the skill name; this skill applies to any generated website.
- Do not add states the source does not have, such as making static detail rows look selected.
- Do not add synthetic state labels that the source page does not render. For example, unselected payment rows should not get a `可选` pill if the webpage only shows a badge on the selected row.
- Ecommerce/order status badges must use semantic state colors, not one shared green style. Use distinct variable-bound styles for pending payment, processing, in transit/receiving, completed, cancelled, and after-sales/danger states.
- Order or task progress must be global to the flow/module and placed outside the detail cards when the source does so. It should render as a timeline/stepper with dots and lines, not as button-like filled pills.
- Address forms must preserve the captured field grouping. If the source uses province/city/district on one row and the detailed address on the next full row, do not collapse it into mixed columns or add deleted fields such as delivery remarks.
- Do not add shadows to same-level cards if the source uses flat layers; keep shadows for floating/sticky layers only.
- Do not use placeholder images when real page assets are available.
- Do not hand-draw icons when the webpage SVG or design-system icon exists.
- Do not let controls inherit browser-default appearance in Figma. Selects, dropdowns, inputs, and buttons must be rebuilt from captured custom control geometry and design-system tokens.
- Select/dropdown value text must follow the captured CSS `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. In Figma, set the value text to a fixed inner width with one-line truncation so long labels such as region names do not wrap inside the control.
- Button labels must use the captured computed text color from the real button/control. Primary or dark buttons with green/dark fills usually have white labels; never let those labels fall back to the body text color.
- Login, registration, empty, modal, dropdown, and other flow states must be captured from the real route/state. Do not replace a real page state with a simplified flow placeholder or an empty illustrative area.
- Keep button radius, padding, text alignment, and vertical breathing room exact; button text must not touch edges.
- Use white or grey backgrounds according to the source. Do not switch a page to a dark theme unless the source is dark.

## References

- Read `references/page-sync-workflow.md` for detailed capture, token, asset, writeback, and verification procedures.
- Use `scripts/browser-page-capture.js` inside Browser `evaluate` for repeatable page capture.
- Use `scripts/compare-layouts.mjs` to compare two saved layout JSON files.

## Shareable Package

This skill is shareable as a folder. To publish it for a team, commit the `figma-page-sync/` folder to a GitHub repository. Other users can install it by copying the folder into `~/.codex/skills/` or by using the Codex skill installer from the repository path.
