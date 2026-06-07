// Figma Page Sync preflight.
// Run this code with Figma `use_figma` before writing webpage modules.
// It only inspects the target file; it does not modify nodes, variables, or styles.

const COMPONENT_ROLE_PATTERNS = {
  navigation: /nav|navigation|header|导航|顶部|菜单|breadcrumb/i,
  button: /button|btn|primary|secondary|按钮|提交|购买|支付|取消|确认/i,
  input: /input|field|textfield|textarea|form|输入|表单|地址|电话|备注/i,
  select: /select|dropdown|picker|option|选择|下拉|省市区|区号/i,
  card: /card|panel|tile|surface|卡片|商品|订单|汇总/i,
  tabs: /tab|segmented|tabs|标签|分段/i,
  badge: /badge|tag|pill|status|徽标|标签|状态/i,
  modal: /modal|dialog|drawer|popover|toast|弹窗|抽屉|浮层/i,
  table: /table|list|row|cell|列表|表格|明细|参数/i,
  icon: /icon|svg|图标/i,
  ecommerce: /cart|checkout|payment|order|coupon|sku|product|商品|结账|支付|订单|优惠券|版本|数量/i
};

const REQUIRED_FOUNDATION_COLLECTIONS = [
  "01 Base",
  "02 Semantic",
  "03 Spacing",
  "04 Typography"
];

const REQUIRED_TEXT_STYLES = [
  "04 Typography/Display/H1",
  "04 Typography/Display/H2",
  "04 Typography/Title/H3",
  "04 Typography/Title/Section",
  "04 Typography/Body/Large",
  "04 Typography/Body/Regular",
  "04 Typography/Body/Small",
  "04 Typography/Caption/Regular",
  "04 Typography/Button/Primary",
  "04 Typography/Button/Secondary"
];

const WRITEBACK_ASSET_COMPONENT_PATTERN =
  /^web-figma-writeback\/assets\/|screenshot|full.?page|reference|截图|整页|页面截图/i;

function sample(items, limit = 12) {
  return items.slice(0, limit);
}

function getFigmaGlobalProperty(name) {
  try {
    return figma[name];
  } catch (error) {
    return null;
  }
}

function getFigmaFunction(name) {
  const value = getFigmaGlobalProperty(name);
  return typeof value === "function" ? value.bind(figma) : null;
}

function roleMatches(name) {
  return Object.fromEntries(
    Object.entries(COMPONENT_ROLE_PATTERNS).map(([role, pattern]) => [
      role,
      pattern.test(name)
    ])
  );
}

async function getLocalVariables() {
  const variablesApi = getFigmaGlobalProperty("variables");
  if (!variablesApi || typeof variablesApi.getLocalVariablesAsync !== "function") {
    return [];
  }

  try {
    return await variablesApi.getLocalVariablesAsync();
  } catch (error) {
    const types = ["COLOR", "FLOAT", "STRING", "BOOLEAN"];
    const groups = await Promise.all(
      types.map(async (type) => {
        try {
          return await variablesApi.getLocalVariablesAsync(type);
        } catch (innerError) {
          return [];
        }
      })
    );
    return groups.flat();
  }
}

async function getLocalCollections() {
  const variablesApi = getFigmaGlobalProperty("variables");
  if (!variablesApi || typeof variablesApi.getLocalVariableCollectionsAsync !== "function") {
    return [];
  }
  return variablesApi.getLocalVariableCollectionsAsync();
}

async function getLocalComponents() {
  const getLocalComponentsAsync = getFigmaFunction("getLocalComponentsAsync");
  if (getLocalComponentsAsync) {
    return getLocalComponentsAsync();
  }
  return figma.root.findAll((node) => node.type === "COMPONENT");
}

async function getLocalComponentSets() {
  const getLocalComponentSetsAsync = getFigmaFunction("getLocalComponentSetsAsync");
  if (getLocalComponentSetsAsync) {
    return getLocalComponentSetsAsync();
  }
  return figma.root.findAll((node) => node.type === "COMPONENT_SET");
}

async function getLocalTextStyles() {
  const getLocalTextStylesAsync = getFigmaFunction("getLocalTextStylesAsync");
  if (getLocalTextStylesAsync) {
    return getLocalTextStylesAsync();
  }
  const getLocalTextStyles = getFigmaFunction("getLocalTextStyles");
  return getLocalTextStyles ? getLocalTextStyles() : [];
}

async function getLocalPaintStyles() {
  const getLocalPaintStylesAsync = getFigmaFunction("getLocalPaintStylesAsync");
  if (getLocalPaintStylesAsync) {
    return getLocalPaintStylesAsync();
  }
  const getLocalPaintStyles = getFigmaFunction("getLocalPaintStyles");
  return getLocalPaintStyles ? getLocalPaintStyles() : [];
}

function isWritebackAssetComponent(component) {
  return WRITEBACK_ASSET_COMPONENT_PATTERN.test(component.name);
}

function componentSummary(components, componentSets) {
  const all = [...components, ...componentSets];
  const assetComponents = all.filter(isWritebackAssetComponent);
  const usable = all.filter((component) => !isWritebackAssetComponent(component));
  const byRole = {};

  for (const role of Object.keys(COMPONENT_ROLE_PATTERNS)) {
    const matches = usable
      .filter((component) => COMPONENT_ROLE_PATTERNS[role].test(component.name))
      .map((component) => ({
        id: component.id,
        key: component.key || null,
        type: component.type,
        name: component.name,
        description: component.description || ""
      }));
    byRole[role] = {
      count: matches.length,
      examples: sample(matches, 8)
    };
  }

  return {
    totalComponents: components.length,
    totalComponentSets: componentSets.length,
    totalReusableComponents: usable.filter((component) => component.type === "COMPONENT").length,
    totalReusableComponentSets: usable.filter((component) => component.type === "COMPONENT_SET").length,
    ignoredWritebackAssetComponents: assetComponents.length,
    byRole,
    ignoredAssetExamples: sample(assetComponents.map((component) => ({
      id: component.id,
      key: component.key || null,
      type: component.type,
      name: component.name
    })), 12),
    examples: sample(usable.map((component) => ({
      id: component.id,
      key: component.key || null,
      type: component.type,
      name: component.name,
      roles: Object.entries(roleMatches(component.name))
        .filter(([, matched]) => matched)
        .map(([role]) => role)
    })), 20)
  };
}

function variableSummary(collections, variables) {
  const byCollectionId = new Map(collections.map((collection) => [collection.id, collection]));
  const byCollection = {};

  for (const variable of variables) {
    const collection = byCollectionId.get(variable.variableCollectionId);
    const collectionName = collection ? collection.name : "Unassigned";
    if (!byCollection[collectionName]) {
      byCollection[collectionName] = { count: 0, variables: [] };
    }
    byCollection[collectionName].count += 1;
    if (byCollection[collectionName].variables.length < 24) {
      byCollection[collectionName].variables.push({
        id: variable.id,
        name: variable.name,
        type: variable.resolvedType,
        scopes: variable.scopes || []
      });
    }
  }

  const collectionNames = collections.map((collection) => collection.name);
  const missingFoundationCollections = REQUIRED_FOUNDATION_COLLECTIONS
    .filter((name) => !collectionNames.includes(name));

  return {
    totalCollections: collections.length,
    totalVariables: variables.length,
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map((mode) => mode.name)
    })),
    byCollection,
    missingFoundationCollections
  };
}

function styleSummary(textStyles, paintStyles) {
  const textStyleNames = textStyles.map((style) => style.name);
  const missingFallbackTextStyles = REQUIRED_TEXT_STYLES
    .filter((name) => !textStyleNames.includes(name));

  return {
    totalTextStyles: textStyles.length,
    totalPaintStyles: paintStyles.length,
    textStyles: sample(textStyles.map((style) => ({
      id: style.id,
      name: style.name,
      fontName: style.fontName,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight
    })), 30),
    paintStyles: sample(paintStyles.map((style) => ({
      id: style.id,
      name: style.name
    })), 30),
    missingFallbackTextStyles
  };
}

const [components, componentSets, collections, variables, textStyles, paintStyles] =
  await Promise.all([
    getLocalComponents(),
    getLocalComponentSets(),
    getLocalCollections(),
    getLocalVariables(),
    getLocalTextStyles(),
    getLocalPaintStyles()
  ]);

const componentsReport = componentSummary(components, componentSets);
const variablesReport = variableSummary(collections, variables);
const stylesReport = styleSummary(textStyles, paintStyles);

const missingReusableRoles = Object.entries(componentsReport.byRole)
  .filter(([, data]) => data.count === 0)
  .map(([role]) => role);

return {
  inspectedAt: new Date().toISOString(),
  file: {
    name: figma.root.name,
    pages: figma.root.children.map((page) => ({
      id: page.id,
      name: page.name,
      childCount: page.children.length
    }))
  },
  components: componentsReport,
  variables: variablesReport,
  styles: stylesReport,
  readiness: {
    hasAnyReusableComponents:
      componentsReport.totalReusableComponents + componentsReport.totalReusableComponentSets > 0,
    hasVariables: variables.length > 0,
    hasTypographyStyles: textStyles.length > 0,
    missingReusableRoles,
    missingFoundationCollections: variablesReport.missingFoundationCollections,
    missingFallbackTextStyles: stylesReport.missingFallbackTextStyles,
    mustCreateFallbackFoundation:
      variablesReport.missingFoundationCollections.length > 0 ||
      textStyles.length === 0,
    screenshotAsFinalOutputAllowed: false
  },
  nextSteps: [
    "Map each webpage module to existing components before creating local nodes.",
    "Create only missing fallback variables/styles before drawing editable modules.",
    "Use real image fills only for webpage image assets, never for whole-page screenshots.",
    "Run figma-editable-output-audit.js after writing modules."
  ]
};
