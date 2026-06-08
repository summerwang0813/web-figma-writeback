# Page Sync Workflow

This reference expands the `figma-page-sync` skill for writing generated or implemented websites back into Figma with exact page synchronization.

## Core Principles

1. Capture or inspect the real source before changing the other side.
2. Keep Figma nodes semantically aligned with webpage modules.
3. Search and reuse the Figma file's component library, styles, and variables before creating local nodes from scratch.
4. If the file has no usable component library, create a fallback foundation before writing the page: `01 Base`, `02 Semantic`, `03 Spacing`, and `04 Typography`.
5. Bind colors, spacing, and text to Figma variables/styles; create missing variables/styles before applying them. Existing variables are mandatory reuse targets.
6. Use real images, real object-fit behavior, and real coordinates.
7. Write and verify in sections, not as one huge unverified operation.
8. Avoid invented states, decorative effects, and layout shortcuts.
9. Keep the workflow website-agnostic; do not bake a specific product or project name into the skill.
10. Final Figma output must be editable. Screenshots are references only, never the primary page/module body.

## Generated Website To Figma Checklist

Collect these inputs:

- Webpage URL and route.
- Viewport width and height.
- Figma file key.
- Figma target page or node ID.
- Component library or design system to reference, when one exists.
- Intended frame width and content width.
- Scope: full page, current viewport, modal, drawer, checkout state, order state, or page section.

Capture these outputs:

- Full-page screenshot.
- Layout JSON with section, text, image, grid, fixed, and sticky bounds.
- CSS variable map.
- Image asset list with `src`, `alt`, natural size, rendered size, and object-fit.
- Console errors and broken image list.
- Component candidates and variable/style matches found in the target Figma file.

Recommended file names:

- `tmp/page-capture.json`
- `tmp/page-source.png`
- `tmp/figma-target.png`
- `tmp/layout-diff.json`

## Component Library And Token Procedure

1. Search existing components, component sets, styles, and variables in the target Figma file and subscribed libraries.
   - Run `scripts/figma-design-system-preflight.js` through `use_figma` before writing.
   - Summarize reusable components by role: navigation, button, input, select, card, tabs, badge, modal, table, icon, ecommerce/order controls.
   - Ignore `web-figma-writeback/assets/...`, `Reference Screenshot`, and other screenshot/reference components when deciding whether a component library exists.
   - Summarize existing variable collections and text/paint styles.
   - Decide which values can be reused and which fallback tokens must be created.
2. Import matching components for buttons, inputs, selectors, tabs, badges, order cards, navigation, icons, and common ecommerce controls.
3. Use variables for every reusable design value.
   - If matching variables exist, bind to them.
   - If the target file has no variables, create the fallback `01 Base`, `02 Semantic`, `03 Spacing`, and `04 Typography` variable collections before drawing modules.
   - If variables exist but a needed color is missing, create the missing color variable in the appropriate existing semantic/base collection and add a trailing `*` to the variable name, such as `text/price*` or `border/active*`.
   - Newly created color variables must immediately be bound to the node that needed them; do not create variables as unused documentation.
   - Final solid fills and strokes on editable UI nodes must not remain raw colors.
4. Use library text styles and color variables when available.
   - Every final text node must have a `textStyleId`.
   - Every solid text fill must be bound to a color variable with `TEXT_FILL` scope. Prefer semantic text variables over primitive colors.
   - Reuse variables such as `text/title`, `text/default`, `text/body`, `text/muted`, `text/white`, `action/primary`, and state colors when they exist.
   - Match text semantically first: brand/logo, display title, section title, inline/card title, body, caption, field label, badge/status, link, price, gallery arrow, and button label.
   - If no existing Text Style matches, create the missing `04 Typography/...` or semantic `Web / ...` style with a trailing `*`, then bind the text node to that style.
   - Existing component-library Text Styles keep their original names; only newly created Text Styles get the `*` marker.
5. If no suitable library exists, create the fallback foundation below before drawing page modules.
6. Set correct scopes:
   - Text colors: `TEXT_FILL`
   - Background fills: `FRAME_FILL`, `SHAPE_FILL`
   - Borders: `STROKE_COLOR`
   - Spacing and size numbers: `GAP`, `WIDTH_HEIGHT`, `CORNER_RADIUS` when supported by the current Figma API.

Use `STROKE_COLOR`, not the older `STROKE` scope.

## Editable Output Gate

The plugin must rebuild UI as editable Figma structure:

- Text from the webpage becomes Figma text nodes using reusable text styles and bound text-fill variables. Raw CSS font values and raw solid colors are allowed only for matching and variable/style creation; final output must reference Text Styles and color variables.
- Editable UI fills and strokes must bind to variables. Raw solid fills/strokes are acceptable only on temporary reference layers, uploaded image fills, or during intermediate construction before binding.
- Buttons, selectors, inputs, tabs, cards, badges, modals, order rows, and navigation use library components when available; otherwise create editable fallback components before using them.
- Icons use the library icon component or the webpage SVG/vector source.
- Real webpage images use image fills with uploaded `imageHash` values.
- Full-page screenshots may be placed only as locked/reference layers named `Reference Screenshot`, or kept in local verification artifacts.

Never satisfy a page/state request by placing a full-page screenshot, large image rectangle, or screenshot component instance as the visible page body. If the agent cannot reconstruct a module editably, it must stop and report the missing component/data instead of using a screenshot fallback.

After writing, run `scripts/figma-editable-output-audit.js`. Any violation blocks completion until the module is rebuilt as editable nodes.

## Fallback Foundation

Create these collections or naming groups when the target Figma file has no component library, no usable variables, or only partial tokens. Keep names stable so later pages can reuse them.

### 01 Base

Use `01 Base` for primitive values. These are raw ingredients, not page meaning.

- Colors:
  - `01 Base/color/white`
  - `01 Base/color/black`
  - `01 Base/color/gray/50`
  - `01 Base/color/gray/100`
  - `01 Base/color/gray/200`
  - `01 Base/color/gray/400`
  - `01 Base/color/gray/600`
  - `01 Base/color/gray/900`
  - `01 Base/color/brand/50`
  - `01 Base/color/brand/100`
  - `01 Base/color/brand/500`
  - `01 Base/color/brand/600`
- Radius:
  - `01 Base/radius/0`
  - `01 Base/radius/4`
  - `01 Base/radius/6`
  - `01 Base/radius/8`
  - `01 Base/radius/12`
- Raw numbers:
  - `01 Base/number/0`
  - `01 Base/number/1`
  - `01 Base/number/2`
  - `01 Base/number/4`
  - `01 Base/number/8`

### 02 Semantic

Use `02 Semantic` for meaning. Alias these to `01 Base` values where Figma variable aliasing is available; otherwise keep values consistent and document the relationship in variable names/descriptions.

- Backgrounds:
  - `02 Semantic/color/bg/page`
  - `02 Semantic/color/bg/surface`
  - `02 Semantic/color/bg/surface-muted`
  - `02 Semantic/color/bg/inverse`
- Text:
  - `02 Semantic/color/text/title`
  - `02 Semantic/color/text/body`
  - `02 Semantic/color/text/muted`
  - `02 Semantic/color/text/inverse`
  - `02 Semantic/color/text/brand`
- Borders:
  - `02 Semantic/color/border/default`
  - `02 Semantic/color/border/subtle`
  - `02 Semantic/color/border/active`
- Actions and states:
  - `02 Semantic/color/action/primary`
  - `02 Semantic/color/action/primary-hover`
  - `02 Semantic/color/action/primary-weak`
  - `02 Semantic/color/state/success`
  - `02 Semantic/color/state/warning`
  - `02 Semantic/color/state/danger`
  - `02 Semantic/color/state/disabled`

### 03 Spacing

Use `03 Spacing` for layout numbers, not color or typography.

- Space scale:
  - `03 Spacing/space/0`
  - `03 Spacing/space/4`
  - `03 Spacing/space/6`
  - `03 Spacing/space/8`
  - `03 Spacing/space/12`
  - `03 Spacing/space/16`
  - `03 Spacing/space/20`
  - `03 Spacing/space/24`
  - `03 Spacing/space/32`
  - `03 Spacing/space/40`
  - `03 Spacing/space/48`
  - `03 Spacing/space/64`
  - `03 Spacing/space/80`
- Layout:
  - `03 Spacing/layout/page-width`
  - `03 Spacing/layout/content-width`
  - `03 Spacing/layout/gutter`
  - `03 Spacing/layout/section-y`
  - `03 Spacing/layout/grid-gap`
- Controls:
  - `03 Spacing/control/button-height`
  - `03 Spacing/control/input-height`
  - `03 Spacing/control/control-radius`
  - `03 Spacing/control/card-radius`

### 04 Typography

Use `04 Typography` for callable typography. Text must not be repeated as hardcoded font values across many layers.

Create text styles first:

- `04 Typography/Display/H1`
- `04 Typography/Display/H2`
- `04 Typography/Title/H3`
- `04 Typography/Title/Section`
- `04 Typography/Body/Large`
- `04 Typography/Body/Regular`
- `04 Typography/Body/Small`
- `04 Typography/Caption/Regular`
- `04 Typography/Button/Primary`
- `04 Typography/Button/Secondary`

Apply text styles to page text nodes. When supported by the current Figma API, also create typography variables:

- `04 Typography/family/primary`
- `04 Typography/family/mono`
- `04 Typography/weight/regular`
- `04 Typography/weight/medium`
- `04 Typography/weight/semibold`
- `04 Typography/size/12`
- `04 Typography/size/14`
- `04 Typography/size/16`
- `04 Typography/size/20`
- `04 Typography/size/24`
- `04 Typography/size/32`
- `04 Typography/line-height/18`
- `04 Typography/line-height/22`
- `04 Typography/line-height/24`
- `04 Typography/line-height/30`
- `04 Typography/line-height/40`
- `04 Typography/letter-spacing/0`

If the API cannot bind a typography variable directly, keep the variable as a design token and use the matching Figma text style as the callable object.

## Asset Procedure

1. Upload image assets through the Figma asset upload flow.
2. Store a `src -> imageHash` map.
3. Use image fills with the correct scale mode.
4. Remove temporary upload placement nodes when they are no longer needed.
5. Verify thumbnails, main images, clipped containers, and active strokes separately.
6. Do not upload full-page screenshots into the editable module tree. Keep them as reference-only artifacts.

## Writeback Procedure

Write in this order unless the page structure requires otherwise:

1. Figma design-system preflight, component-role map, fallback foundation if needed, variables, text styles, and frame shell.
2. Header or navigation.
3. Primary hero or page title area.
4. Main product/gallery/detail modules.
5. Forms, selectors, order details, and stateful cards.
6. Sticky/floating bars.
7. Long comparison tables, order lists, and lower sections.
8. Editable-output audit, final screenshot, and node-coordinate verification.

After each module, return a compact result:

```json
{
  "status": "module-written",
  "frameId": "123:456",
  "module": {
    "name": "Product Gallery",
    "id": "123:789",
    "x": 120,
    "y": 137,
    "width": 632,
    "height": 723
  }
}
```

## Optional Figma To Website Checklist

Inspect the Figma source:

- Frame size and target breakpoint.
- Auto-layout direction, padding, gap, and alignment.
- Text style, line-height, weight, and color variables.
- Fill, stroke, radius, and effects.
- Image fill crop and aspect ratio.
- Component instances and variant states.

Patch the webpage:

- Locate the matching route/component/CSS.
- Preserve the existing app's state management and ecommerce flow.
- Update only the files needed for the visual or structural change.
- Use existing CSS variables or add matching tokens where the codebase already supports them.
- Verify with Browser screenshots at the requested breakpoint.

## Verification Gates

Before calling a sync complete, verify:

- Frame/page width is correct.
- Content width and side gutters are correct.
- Top-level module count and order match the source.
- Grid columns, gaps, and card widths match.
- Text wraps the same way or within acceptable browser/Figma differences.
- Buttons have correct radius, padding, and vertical spacing.
- Images are not broken, stretched, or cropped incorrectly.
- Icons are centered and use the same SVG/component source.
- Figma component instances, variables, and text styles are used when available.
- Missing design-system values were added to `01 Base`, `02 Semantic`, `03 Spacing`, or `04 Typography` before use.
- Any newly created color variable has a trailing `*` in its name and is actually bound to at least one final node.
- No final editable UI solid fill, text fill, or stroke remains as a raw color.
- Repeated typography uses callable text styles, not duplicated one-off layer values.
- No large screenshot/image component is being used as the final page/module body.
- No accidental selected, hover, disabled, or active states were added.
- Sticky/floating layers keep appropriate elevation; same-level content stays flat when source is flat.

## Common Fixes

- If Figma is offset from the webpage, recapture section bounds and rewrite the wrong module instead of nudging many children.
- If icons drift, use the source SVG `viewBox` and a fixed icon box.
- If images drift, compare outer frame, image fill, and clip settings separately.
- If text touches a button edge, inspect button padding and line-height before changing font size.
- If a Figma write fails, send a small probe, reduce payload size, and split modules further.
