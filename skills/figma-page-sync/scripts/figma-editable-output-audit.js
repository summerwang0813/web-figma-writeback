// Figma Page Sync editable-output audit.
// Run this code with Figma `use_figma` after writing webpage modules.
// It flags pages/modules that are likely screenshot-only instead of editable.

const CONFIG = {
  // Leave empty to audit every page except obvious asset/reference pages.
  targetPageNames: [],
  minLargeImageWidth: 1000,
  minLargeImageHeight: 600,
  minEditableTextNodesPerPage: 3,
  requireTextStyleBinding: true,
  requireTextFillVariableBinding: true,
  requireSolidPaintVariableBinding: true,
  requireSelectValueTruncation: true,
  requireNoTextGlyphSelectIcons: true,
  requireNoSyntheticOptionalStatus: true,
  requireTimelineProgressNotButtons: true,
  maxSelectValueTextHeight: 24,
  selectValueNamePattern: /select value|dropdown value|picker value|选择器值|下拉值/i,
  selectIconNamePattern: /select|dropdown|picker|chevron|arrow|选择|下拉|省份|城市|区县|电话|地区/i,
  selectIconGlyphPattern: /^(v|V|⌄|⌃|⌵|⌄|▾|▼|▲|∨|∧|˅|﹀|˄|⌃|>)$/,
  syntheticOptionalStatusPattern: /^可选$/,
  statusNodeNamePattern: /status|badge|pill|tag|payment|method|状态|标签|徽标|支付/i,
  progressStepTextPattern: /^(待付款|待发货|待收货|已签收|已完成|售后处理中|已取消)$/,
  progressNodeNamePattern: /progress|timeline|step|order status|order-step|订单进度|进度|步骤|履约/i,
  screenshotNamePattern: /screenshot|full.?page|reference|截图|整页|页面截图/i,
  assetPageNamePattern: /asset|component|library|组件|素材|page 1/i
};

function hasImageFill(node) {
  return Array.isArray(node.fills) && node.fills.some((fill) => fill.type === "IMAGE");
}

function hasSolidOrGradientFill(node) {
  return Array.isArray(node.fills) && node.fills.some((fill) => fill.type !== "IMAGE");
}

function hasUnboundSolidPaint(paints) {
  if (!Array.isArray(paints)) return false;
  return paints.some((paint) =>
    paint.type === "SOLID" && !paint.boundVariables?.color
  );
}

function hasUnboundSolidTextFill(node) {
  if (node.type !== "TEXT" || !Array.isArray(node.fills)) return false;
  return hasUnboundSolidPaint(node.fills);
}

function hasInspectableSolidFill(node) {
  return Array.isArray(node.fills) &&
    node.fills.some((paint) => paint.type === "SOLID");
}

function hasInspectableSolidStroke(node) {
  return Array.isArray(node.strokes) &&
    node.strokes.some((paint) => paint.type === "SOLID");
}

function looksLikeReferenceNode(node) {
  return CONFIG.screenshotNamePattern.test(node.name || "");
}

function isSelectValueText(node) {
  return node.type === "TEXT" && CONFIG.selectValueNamePattern.test(node.name || "");
}

function isTextGlyphSelectIcon(node) {
  if (node.type !== "TEXT") return false;
  if (!CONFIG.selectIconGlyphPattern.test((node.characters || "").trim())) return false;
  return CONFIG.selectIconNamePattern.test(nodeNamePath(node, 6));
}

function nodeNamePath(node, limit = 4) {
  const names = [];
  let current = node;
  while (current && names.length < limit) {
    names.push(current.name || "");
    current = current.parent;
  }
  return names.join(" / ");
}

function hasVisibleSolidFill(node) {
  return Array.isArray(node.fills) &&
    node.fills.some((paint) => paint.visible !== false && paint.type === "SOLID" && paint.opacity !== 0);
}

function isSyntheticOptionalStatusText(node) {
  if (node.type !== "TEXT") return false;
  if (!CONFIG.syntheticOptionalStatusPattern.test((node.characters || "").trim())) return false;
  return CONFIG.statusNodeNamePattern.test(nodeNamePath(node));
}

function isButtonLikeProgressText(node) {
  if (node.type !== "TEXT") return false;
  if (!CONFIG.progressStepTextPattern.test((node.characters || "").trim())) return false;
  if (!CONFIG.progressNodeNamePattern.test(nodeNamePath(node, 5))) return false;
  let current = node.parent;
  let depth = 0;
  while (current && current.type !== "PAGE" && depth < 3) {
    if (
      hasVisibleSolidFill(current) &&
      current.width >= 48 &&
      current.width <= 360 &&
      current.height >= 30 &&
      current.height <= 72
    ) {
      return true;
    }
    current = current.parent;
    depth += 1;
  }
  return false;
}

function hasSingleLineTruncation(node) {
  return node.textAutoResize === "TRUNCATE" ||
    node.textTruncation === "ENDING" ||
    node.maxLines === 1;
}

function isLargeImageNode(node) {
  return hasImageFill(node) &&
    node.width >= CONFIG.minLargeImageWidth &&
    node.height >= CONFIG.minLargeImageHeight;
}

function walk(node, callback) {
  callback(node);
  if ("children" in node) {
    for (const child of node.children) walk(child, callback);
  }
}

function countEditableNodes(root) {
  const counts = {
    text: 0,
    frames: 0,
    instances: 0,
    vectors: 0,
    shapes: 0,
    largeImages: 0,
    imageOnlyLargeNodes: 0,
    textWithoutStyle: 0,
    textWithoutFillVariable: 0,
    nodesWithoutFillVariable: 0,
    nodesWithoutStrokeVariable: 0,
    selectValueTextWithoutTruncation: 0,
    textGlyphSelectIcons: 0,
    syntheticOptionalStatusTexts: 0,
    buttonLikeProgressTexts: 0
  };

  walk(root, (node) => {
    const isReference = looksLikeReferenceNode(node);

    if (node.type === "TEXT") {
      counts.text += 1;
      if (CONFIG.requireTextStyleBinding && typeof node.textStyleId !== "string") {
        counts.textWithoutStyle += 1;
      }
      if (CONFIG.requireTextFillVariableBinding && hasUnboundSolidTextFill(node)) {
        counts.textWithoutFillVariable += 1;
      }
      if (
        CONFIG.requireSelectValueTruncation &&
        isSelectValueText(node) &&
        (!hasSingleLineTruncation(node) || node.height > CONFIG.maxSelectValueTextHeight)
      ) {
        counts.selectValueTextWithoutTruncation += 1;
      }
      if (CONFIG.requireNoTextGlyphSelectIcons && isTextGlyphSelectIcon(node)) {
        counts.textGlyphSelectIcons += 1;
      }
      if (CONFIG.requireNoSyntheticOptionalStatus && isSyntheticOptionalStatusText(node)) {
        counts.syntheticOptionalStatusTexts += 1;
      }
      if (CONFIG.requireTimelineProgressNotButtons && isButtonLikeProgressText(node)) {
        counts.buttonLikeProgressTexts += 1;
      }
    }
    if (
      CONFIG.requireSolidPaintVariableBinding &&
      !isReference &&
      node.type !== "TEXT" &&
      hasInspectableSolidFill(node) &&
      hasUnboundSolidPaint(node.fills)
    ) {
      counts.nodesWithoutFillVariable += 1;
    }
    if (
      CONFIG.requireSolidPaintVariableBinding &&
      !isReference &&
      hasInspectableSolidStroke(node) &&
      hasUnboundSolidPaint(node.strokes)
    ) {
      counts.nodesWithoutStrokeVariable += 1;
    }
    if (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION") counts.frames += 1;
    if (node.type === "INSTANCE") counts.instances += 1;
    if (["VECTOR", "BOOLEAN_OPERATION", "LINE", "ELLIPSE", "POLYGON", "STAR"].includes(node.type)) {
      counts.vectors += 1;
    }
    if (["RECTANGLE", "ELLIPSE", "POLYGON", "STAR"].includes(node.type)) counts.shapes += 1;
    if (isLargeImageNode(node)) {
      counts.largeImages += 1;
      const childCount = "children" in node ? node.children.length : 0;
      if (childCount === 0 && !hasSolidOrGradientFill(node)) counts.imageOnlyLargeNodes += 1;
    }
  });

  return counts;
}

function auditPage(page) {
  const counts = countEditableNodes(page);
  const violations = [];
  const largeImageNodes = [];
  const textWithoutStyleNodes = [];
  const textWithoutFillVariableNodes = [];
  const nodesWithoutFillVariable = [];
  const nodesWithoutStrokeVariable = [];
  const selectValueTextWithoutTruncationNodes = [];
  const textGlyphSelectIconNodes = [];
  const syntheticOptionalStatusTextNodes = [];
  const buttonLikeProgressTextNodes = [];

  walk(page, (node) => {
    if (CONFIG.requireTextStyleBinding && node.type === "TEXT" && typeof node.textStyleId !== "string") {
      textWithoutStyleNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters.slice(0, 80)
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "text-node-without-text-style",
        detail: "Final editable text must bind to an existing Text Style via textStyleId. Use the component library Text Style first; create a missing 04 Typography style only when no match exists."
      });
    }

    if (CONFIG.requireTextFillVariableBinding && node.type === "TEXT" && hasUnboundSolidTextFill(node)) {
      textWithoutFillVariableNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters.slice(0, 80)
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "text-node-without-fill-variable",
        detail: "Final editable text fills must bind to color variables via paint.boundVariables.color. Use semantic TEXT_FILL variables such as text/title, text/body, text/muted, text/white, action/primary, and state colors."
      });
    }

    if (
      CONFIG.requireSelectValueTruncation &&
      isSelectValueText(node) &&
      (!hasSingleLineTruncation(node) || node.height > CONFIG.maxSelectValueTextHeight)
    ) {
      selectValueTextWithoutTruncationNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters.slice(0, 80),
        height: Math.round(node.height),
        textAutoResize: node.textAutoResize,
        textTruncation: node.textTruncation,
        maxLines: node.maxLines
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "select-value-text-wraps-instead-of-truncating",
        detail: "Dropdown/select value text must mimic CSS white-space: nowrap; overflow: hidden; text-overflow: ellipsis. Set fixed text width, textAutoResize/TRUNCATE or textTruncation/ENDING, and keep it to one line so long labels do not wrap inside controls."
      });
    }

    if (CONFIG.requireNoTextGlyphSelectIcons && isTextGlyphSelectIcon(node)) {
      textGlyphSelectIconNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters.slice(0, 20),
        path: nodeNamePath(node, 6)
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "select-icon-rendered-as-text-glyph",
        detail: "Dropdown/select chevrons must be real vector/SVG/icon nodes from the source or component library, not text glyphs such as `⌄`, `v`, or `▼`. Text glyph icons render inconsistently and look unlike the webpage."
      });
    }

    if (CONFIG.requireNoSyntheticOptionalStatus && isSyntheticOptionalStatusText(node)) {
      syntheticOptionalStatusTextNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters.slice(0, 80),
        path: nodeNamePath(node, 6)
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "synthetic-optional-status-text",
        detail: "Do not add placeholder status text such as `可选` to unselected payment/method rows unless the source webpage actually renders that text. Unselected rows should stay plain; only selected/current states get badges."
      });
    }

    if (CONFIG.requireTimelineProgressNotButtons && isButtonLikeProgressText(node)) {
      buttonLikeProgressTextNodes.push({
        id: node.id,
        name: node.name,
        text: node.characters.slice(0, 80),
        path: nodeNamePath(node, 6)
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "progress-step-rendered-as-button",
        detail: "Order/progress steps should be a global timeline or stepper outside the detail panels, not filled button-like pills. Keep dots/lines as the progress affordance and reserve filled badges for the current status label."
      });
    }

    const isReference = looksLikeReferenceNode(node);

    if (
      CONFIG.requireSolidPaintVariableBinding &&
      !isReference &&
      node.type !== "TEXT" &&
      hasInspectableSolidFill(node) &&
      hasUnboundSolidPaint(node.fills)
    ) {
      nodesWithoutFillVariable.push({
        id: node.id,
        type: node.type,
        name: node.name
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "node-fill-without-color-variable",
        detail: "Final editable solid fills must bind to color variables. Reuse existing variables first; if the file has variables but the needed color is missing, create a color variable with a trailing * and bind this fill to it."
      });
    }

    if (
      CONFIG.requireSolidPaintVariableBinding &&
      !isReference &&
      hasInspectableSolidStroke(node) &&
      hasUnboundSolidPaint(node.strokes)
    ) {
      nodesWithoutStrokeVariable.push({
        id: node.id,
        type: node.type,
        name: node.name
      });
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "node-stroke-without-color-variable",
        detail: "Final editable solid strokes must bind to color variables. Reuse existing variables first; if the file has variables but the needed color is missing, create a color variable with a trailing * and bind this stroke to it."
      });
    }

    if (!isLargeImageNode(node)) return;

    const childCount = "children" in node ? node.children.length : 0;
    const looksLikeReference = looksLikeReferenceNode(node);
    largeImageNodes.push({
      id: node.id,
      type: node.type,
      name: node.name,
      width: Math.round(node.width),
      height: Math.round(node.height),
      childCount,
      looksLikeReference
    });

    if (!looksLikeReference && childCount === 0) {
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "large-image-node-used-as-editable-content",
        detail: "Large image-filled nodes may only be product/content images or locked reference layers. Rebuild UI text, buttons, cards, forms, tables, and navigation as editable nodes."
      });
    }

    if (node.type === "INSTANCE" && childCount === 0 && !looksLikeReference) {
      violations.push({
        id: node.id,
        type: node.type,
        name: node.name,
        issue: "screenshot-component-instance",
        detail: "A component instance with a large image fill is not an editable page/module."
      });
    }
  });

  if (counts.text < CONFIG.minEditableTextNodesPerPage && counts.largeImages > 0) {
    violations.push({
      id: page.id,
      type: page.type,
      name: page.name,
      issue: "page-has-images-but-too-few-editable-text-nodes",
      detail: "The page likely relies on screenshot imagery instead of editable text and module nodes."
    });
  }

  return {
    pageId: page.id,
    page: page.name,
    counts,
    largeImageNodes,
    textWithoutStyleNodes: textWithoutStyleNodes.slice(0, 40),
    textWithoutFillVariableNodes: textWithoutFillVariableNodes.slice(0, 40),
    nodesWithoutFillVariable: nodesWithoutFillVariable.slice(0, 40),
    nodesWithoutStrokeVariable: nodesWithoutStrokeVariable.slice(0, 40),
    selectValueTextWithoutTruncationNodes: selectValueTextWithoutTruncationNodes.slice(0, 40),
    textGlyphSelectIconNodes: textGlyphSelectIconNodes.slice(0, 40),
    syntheticOptionalStatusTextNodes: syntheticOptionalStatusTextNodes.slice(0, 40),
    buttonLikeProgressTextNodes: buttonLikeProgressTextNodes.slice(0, 40),
    violations
  };
}

const pages = figma.root.children.filter((page) => {
  if (CONFIG.targetPageNames.length > 0) return CONFIG.targetPageNames.includes(page.name);
  return !CONFIG.assetPageNamePattern.test(page.name);
});

const pagesReport = pages.map(auditPage);
const violations = pagesReport.flatMap((page) =>
  page.violations.map((violation) => ({ page: page.page, ...violation }))
);

return {
  auditedAt: new Date().toISOString(),
  pass: violations.length === 0,
  violationCount: violations.length,
  violations,
  pages: pagesReport,
  rule: "Full-page screenshots and large screenshot component instances are not acceptable final writeback output. Rebuild as editable semantic Figma nodes, bind final text nodes to Text Styles, bind every final solid text fill, node fill, and stroke to color variables, keep dropdown/select value text single-line truncated like the source CSS, render dropdown chevrons as vector/SVG icons instead of text glyphs, do not add synthetic unselected status labels, and render order progress as a global timeline instead of button-like pills. Reuse variables first; create missing color variables with a trailing * before binding."
};
