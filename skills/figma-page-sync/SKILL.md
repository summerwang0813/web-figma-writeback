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

## Fallback Design System

When the Figma file does not already have a usable component library, create variables and text styles in this order:

1. `01 Base`: primitive colors, neutral ramps, brand ramps, radius primitives, and raw numeric values.
2. `02 Semantic`: semantic aliases for background, surface, title text, body text, muted text, border, primary action, warning, success, danger, and disabled states.
3. `03 Spacing`: spacing, gap, padding, container width, section spacing, radius, and control height tokens.
4. `04 Typography`: reusable typography tokens and callable text styles.

Typography must be reusable, not hardcoded per text layer. Create Figma text styles such as `04 Typography/Display/H1`, `04 Typography/Title/H2`, `04 Typography/Body/Regular`, `04 Typography/Button/Primary`, and apply those styles to text nodes. Where the Figma API supports variable binding for typography values, also create numeric/string variables for font family, font size, line height, font weight, and letter spacing; otherwise the text styles are the callable typography surface.

## Website To Figma

1. Capture the running route before writing anything.
   - Save a viewport screenshot.
   - Capture DOM section bounds, text bounds, image bounds, CSS variables, fixed/sticky elements, and scroll height.
   - Use `scripts/browser-page-capture.js` as the browser-side capture snippet when useful.

2. Split the page into semantic modules.
   - Top-level Figma frames should match webpage modules such as `Header`, `Hero`, `Product Gallery`, `Checkout Summary`, `Payment Detail`, `Order List`.
   - Do not merge unrelated modules into one frame.

3. Prepare component-library references, tokens, and assets.
   - Search Figma libraries first.
   - Import matching component instances from the component library when available.
   - If no component library exists, create the fallback `01 Base / 02 Semantic / 03 Spacing / 04 Typography` system first.
   - Bind fills, strokes, and text colors to existing variables.
   - Bind typography to text styles; do not leave repeated font settings as one-off layer properties.
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
- Do not write a page into a file with no design-system foundation; create `01 Base`, `02 Semantic`, `03 Spacing`, and `04 Typography` first.
- Do not hardcode typography on repeated text nodes; create callable text styles and apply them.
- Do not treat the current website's product/project name as the skill name; this skill applies to any generated website.
- Do not add states the source does not have, such as making static detail rows look selected.
- Do not add shadows to same-level cards if the source uses flat layers; keep shadows for floating/sticky layers only.
- Do not use placeholder images when real page assets are available.
- Do not hand-draw icons when the webpage SVG or design-system icon exists.
- Keep button radius, padding, text alignment, and vertical breathing room exact; button text must not touch edges.
- Use white or grey backgrounds according to the source. Do not switch a page to a dark theme unless the source is dark.

## References

- Read `references/page-sync-workflow.md` for detailed capture, token, asset, writeback, and verification procedures.
- Use `scripts/browser-page-capture.js` inside Browser `evaluate` for repeatable page capture.
- Use `scripts/compare-layouts.mjs` to compare two saved layout JSON files.

## Shareable Package

This skill is shareable as a folder. To publish it for a team, commit the `figma-page-sync/` folder to a GitHub repository. Other users can install it by copying the folder into `~/.codex/skills/` or by using the Codex skill installer from the repository path.
