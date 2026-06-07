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
      gridTemplateColumns: style.gridTemplateColumns,
      gap: style.gap,
      padding: style.padding,
      margin: style.margin,
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      objectFit: style.objectFit
    };
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
  const captureElement = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    className: typeof el.className === "string" ? el.className : "",
    role: el.getAttribute("role") || "",
    name: el.getAttribute("aria-label") || el.querySelector("h1,h2,h3")?.textContent?.trim() || "",
    text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 300),
    rect: rectOf(el),
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
    images: [...document.images].map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      rect: rectOf(img),
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
