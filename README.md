# Web Figma Writeback

Standalone Codex plugin for writing implemented websites back to Figma.

This plugin is website-agnostic. It can be used with any generated or implemented web page, including landing pages, ecommerce flows, dashboards, SaaS tools, portfolios, and prototypes. The running webpage is treated as the source of truth.

## What It Does

- Captures real webpage layout, text, images, CSS variables, and section bounds.
- Rebuilds matching Figma frames using editable semantic modules.
- Reuses the target Figma file's component library, variables, styles, and icons.
- Creates fallback foundations when needed:
  - `01 Base`
  - `02 Semantic`
  - `03 Spacing`
  - `04 Typography`
- Applies reusable typography styles instead of one-off text styling.
- Forces final solid text fills, node fills, and strokes to bind to Figma variables. Variable matching must check both semantic role and resolved hex value from the captured CSS; if variables already exist but a needed color is missing or resolves differently, the plugin workflow creates the missing color variable with a trailing `*` before binding it.
- Uses screenshots only as references for verification, not as the final editable page.
- Verifies Figma output against the captured webpage layout and screenshots.

## Important: Editable Output Only

This plugin is not a screenshot-to-Figma exporter. A full-page screenshot, image rectangle, or screenshot component instance must not be used as the final page body.

The final Figma output should be editable: text nodes for text, component instances for controls, frames/auto-layout for modules, vectors/SVGs for icons, and image fills only for real webpage images such as product photos or hero media.

Before writing, run the design-system preflight so the target file's existing components, variables, and typography styles are reused. If the target file has no usable design system, create the fallback foundations first. Final editable output must not leave raw solid colors on text, fills, or strokes.

## Structure

```text
web-figma-writeback/
├── .codex-plugin/plugin.json
├── README.md
├── docs/
│   └── webpage-writeback-workflow.md
└── skills/
    └── figma-page-sync/
        ├── SKILL.md
        ├── agents/openai.yaml
        ├── references/page-sync-workflow.md
        └── scripts/
            ├── browser-page-capture.js
            ├── figma-design-system-preflight.js
            ├── figma-editable-output-audit.js
            └── compare-layouts.mjs
```

## Install

Copy or clone this plugin as its own folder. Do not place it inside a website project.

For skill-only usage:

```bash
mkdir -p ~/.codex/skills
cp -R skills/figma-page-sync ~/.codex/skills/
```

For plugin usage, install or share the whole `web-figma-writeback/` folder in Codex.

## How To Use

1. Open or run the website you want to sync.
   - Local examples: `http://127.0.0.1:4173/#/checkout`, `http://localhost:3000/`
   - The page in the browser is the source of truth.

2. Prepare the target Figma file.
   - Use an existing Figma design file URL.
   - If possible, provide a node-specific URL for the target page or frame.
   - Make sure Codex has permission to write to the Figma file.

3. Ask Codex to use the skill.

```text
Use $figma-page-sync to write the current webpage into this Figma file:
https://www.figma.com/design/FILE_KEY/FILE_NAME?node-id=NODE-ID

Use the real webpage layout as the source of truth. Reuse the component library and variables. If the file has no usable library, create 01 Base, 02 Semantic, 03 Spacing, and 04 Typography first.
```

4. Expected workflow.
   - Capture the actual webpage DOM, CSS variables, images, text, and layout bounds.
   - Run `figma-design-system-preflight.js` in the target Figma file.
   - Search the target Figma file for components, variables, styles, and libraries.
   - Create missing variables and typography styles only when needed.
   - Write the page into Figma module by module as editable nodes.
   - Run `figma-editable-output-audit.js` to block screenshot-only output.
   - Verify Figma coordinates and screenshots against the webpage.

5. Re-sync after code changes.

```text
Use $figma-page-sync to sync the current webpage back to Figma again. Keep the existing design-system variables and update only changed modules.
```

## Example Prompt

```text
Use $figma-page-sync to write the current website back to Figma. Reuse the component library; if none exists, create 01 Base, 02 Semantic, 03 Spacing, and 04 Typography variables first.
```

## Notes

- The plugin should stay separate from any website repository.
- Website projects should contain only their app code and assets.
- This plugin can be versioned, published, or shared independently.
