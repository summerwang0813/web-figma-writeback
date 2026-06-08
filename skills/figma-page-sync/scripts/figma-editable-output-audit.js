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
  screenshotNamePattern: /screenshot|full.?page|reference|截图|整页|页面截图/i,
  assetPageNamePattern: /asset|component|library|组件|素材|page 1/i
};

function hasImageFill(node) {
  return Array.isArray(node.fills) && node.fills.some((fill) => fill.type === "IMAGE");
}

function hasSolidOrGradientFill(node) {
  return Array.isArray(node.fills) && node.fills.some((fill) => fill.type !== "IMAGE");
}

function hasUnboundSolidTextFill(node) {
  if (node.type !== "TEXT" || !Array.isArray(node.fills)) return false;
  return node.fills.some((fill) =>
    fill.type === "SOLID" && !fill.boundVariables?.color
  );
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
    textWithoutFillVariable: 0
  };

  walk(root, (node) => {
    if (node.type === "TEXT") {
      counts.text += 1;
      if (CONFIG.requireTextStyleBinding && typeof node.textStyleId !== "string") {
        counts.textWithoutStyle += 1;
      }
      if (CONFIG.requireTextFillVariableBinding && hasUnboundSolidTextFill(node)) {
        counts.textWithoutFillVariable += 1;
      }
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

    if (!isLargeImageNode(node)) return;

    const childCount = "children" in node ? node.children.length : 0;
    const looksLikeReference = CONFIG.screenshotNamePattern.test(node.name);
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
  rule: "Full-page screenshots and large screenshot component instances are not acceptable final writeback output. Rebuild as editable semantic Figma nodes, bind final text nodes to Text Styles and color variables, and use screenshots only as references."
};
