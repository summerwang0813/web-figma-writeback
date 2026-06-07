# Web Figma Writeback

Standalone Codex plugin for writing implemented websites back to Figma.

This plugin is website-agnostic. It can be used with any generated or implemented web page, including landing pages, ecommerce flows, dashboards, SaaS tools, portfolios, and prototypes. The running webpage is treated as the source of truth.

## What It Does

- Captures real webpage layout, text, images, CSS variables, and section bounds.
- Writes matching Figma frames using semantic modules.
- Reuses the target Figma file's component library, variables, styles, and icons.
- Creates fallback foundations when needed:
  - `01 Base`
  - `02 Semantic`
  - `03 Spacing`
  - `04 Typography`
- Applies reusable typography styles instead of one-off text styling.
- Verifies Figma output against the captured webpage layout and screenshots.

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

## Example Prompt

```text
Use $figma-page-sync to write the current website back to Figma. Reuse the component library; if none exists, create 01 Base, 02 Semantic, 03 Spacing, and 04 Typography variables first.
```

## Notes

- The plugin should stay separate from any website repository.
- Website projects should contain only their app code and assets.
- This plugin can be versioned, published, or shared independently.
