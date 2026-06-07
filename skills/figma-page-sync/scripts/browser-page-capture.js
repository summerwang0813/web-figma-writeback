(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const rectOf = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: round(rect.left + window.scrollX),
      y: round(rect.top + window.scrollY),
      width: round(rect.width),
      height: round(rect.height)
    };
  };
  const pickStyle = (el) => {
    const style = getComputedStyle(el);
    return {
      display: style.display,
      position: style.position,
      zIndex: style.zIndex,
      overflow: style.overflow,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      gridTemplateColumns: style.gridTemplateColumns,
      gridTemplateRows: style.gridTemplateRows,
      gap: style.gap,
      columnGap: style.columnGap,
      rowGap: style.rowGap,
      padding: style.padding,
      margin: style.margin,
      width: style.width,
      height: style.height,
      minWidth: style.minWidth,
      minHeight: style.minHeight,
      maxWidth: style.maxWidth,
      maxHeight: style.maxHeight,
      color: style.color,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      backgroundSize: style.backgroundSize,
      backgroundPosition: style.backgroundPosition,
      borderColor: style.borderColor,
      borderStyle: style.borderStyle,
      borderWidth: style.borderWidth,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      opacity: style.opacity,
      transform: style.transform,
      textAlign: style.textAlign,
      whiteSpace: style.whiteSpace,
      letterSpacing: style.letterSpacing,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition
    };
  };
  const intersectRects = (a, b) => {
    const left = Math.max(a.x, b.x);
    const top = Math.max(a.y, b.y);
    const right = Math.min(a.x + a.width, b.x + b.width);
    const bottom = Math.min(a.y + a.height, b.y + b.height);
    return {
      x: round(left),
      y: round(top),
      width: round(Math.max(0, right - left)),
      height: round(Math.max(0, bottom - top))
    };
  };
  const clippingAncestors = (el) => {
    const ancestors = [];
    let parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      const style = getComputedStyle(parent);
      const clips =
        /(hidden|clip|scroll|auto)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`);
      if (clips) {
        ancestors.push({
          tag: parent.tagName.toLowerCase(),
          id: parent.id || "",
          className: typeof parent.className === "string" ? parent.className : "",
          rect: rectOf(parent),
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY
        });
      }
      parent = parent.parentElement;
    }
    return ancestors;
  };
  const visibleRectOf = (el) => {
    let visible = rectOf(el);
    for (const ancestor of clippingAncestors(el)) {
      visible = intersectRects(visible, ancestor.rect);
    }
    return visible;
  };
  const cssVariableNames = [
    "--brand",
    "--brand-weak",
    "--brand-weakest",
    "--title",
    "--text",
    "--text-2",
    "--text-3",
    "--line",
    "--surface",
    "--surface-2",
    "--radius",
    "--shadow"
  ];
  const rootStyle = getComputedStyle(document.documentElement);
  const cssVariables = Object.fromEntries(
    cssVariableNames
      .map((name) => [name, rootStyle.getPropertyValue(name).trim()])
      .filter(([, value]) => value)
  );
  const semanticTextRoleOf = (el) => {
    const tag = el.tagName.toLowerCase();
    const className = typeof el.className === "string" ? el.className : "";
    const role = el.getAttribute("role") || "";
    if (/(logo|brand)/i.test(className)) return "brand-mark";
    if (tag === "h1") return "heading-1";
    if (tag === "h2") return "heading-2";
    if (tag === "h3") return "section-title";
    if (tag === "button" || role === "button" || /\bbtn\b/.test(className)) return "button-label";
    if (tag === "label" || /field-label|form-label/.test(className)) return "field-label";
    if (/badge|pill|status|tag/.test(className)) return "badge-status";
    if (/price|amount|total/.test(className)) return "price";
    if (/caption|meta|note|hint|tip/.test(className)) return "caption";
    if (tag === "a" || /link/.test(className)) return "link";
    if (/arrow|gallery/.test(className)) return "gallery-arrow";
    if (/title|heading/.test(className)) return "inline-title";
    return "body";
  };
  const captureElement = (el) => ({
    semanticRole: (() => {
      const className = typeof el.className === "string" ? el.className : "";
      const tag = el.tagName.toLowerCase();
      if ((tag === "button" || tag === "a") && /\bbtn\b/.test(className) && /\b(primary|dark)\b/.test(className)) return "button-primary";
      if ((tag === "button" || tag === "a") && /\bbtn\b/.test(className) && /\bsecondary\b/.test(className)) return "button-secondary";
      if (/select-trigger|select-menu|select-option/.test(className)) return "custom-select";
      if (/modal|dialog/.test(className) || el.getAttribute("role") === "dialog") return "modal";
      if (/address-card|coupon-card|payment-card|option-card/.test(className)) return "choice-card";
      return "";
    })(),
    semanticTextRole: semanticTextRoleOf(el),
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    className: typeof el.className === "string" ? el.className : "",
    role: el.getAttribute("role") || "",
    type: el.getAttribute("type") || "",
    href: el.getAttribute("href") || "",
    src: el.getAttribute("src") || "",
    name: el.getAttribute("aria-label") || el.querySelector("h1,h2,h3")?.textContent?.trim() || "",
    text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 300),
    rect: rectOf(el),
    visibleRect: visibleRectOf(el),
    clippingAncestors: clippingAncestors(el),
    disabled: Boolean(el.disabled),
    checked: Boolean(el.checked),
    selected: Boolean(el.selected),
    ariaExpanded: el.getAttribute("aria-expanded") || "",
    data: Object.fromEntries([...el.attributes]
      .filter((attr) => attr.name.startsWith("data-"))
      .map((attr) => [attr.name, attr.value])),
    style: pickStyle(el)
  });
  return {
    capturedAt: new Date().toISOString(),
    url: location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    document: {
      width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    },
    cssVariables,
    sections: [...document.querySelectorAll("header, main > section, #app > section, footer")].map(captureElement),
    textBlocks: [...document.querySelectorAll("h1,h2,h3,p,a,button,label,strong,span")]
      .filter((el) => el.textContent.trim())
      .slice(0, 240)
      .map(captureElement),
    controls: [...document.querySelectorAll("button,input,textarea,select,[role='button'],[role='listbox'],[role='option'],[aria-expanded]")]
      .slice(0, 240)
      .map(captureElement),
    overlays: [...document.querySelectorAll("[role='dialog'],[role='listbox'],.modal,.popover,.dropdown,.select-menu,[class*='modal'],[class*='popover'],[class*='dropdown'],[class*='select-menu']")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      })
      .map(captureElement),
    images: [...document.images].map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      rect: rectOf(img),
      visibleRect: visibleRectOf(img),
      clippingAncestors: clippingAncestors(img),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      style: pickStyle(img)
    })),
    fixedOrSticky: [...document.querySelectorAll("*")]
      .filter((el) => {
        const position = getComputedStyle(el).position;
        return position === "fixed" || position === "sticky";
      })
      .map(captureElement)
  };
})();
