import type { CSSProperties } from "react";

export function buildBlockStyle(config: Record<string, any>): CSSProperties {
  const style: CSSProperties = {};

  // Background color
  if (config.style_bg_color) style.backgroundColor = config.style_bg_color;

  // Gradient (overrides bg color)
  if (config.style_gradient_enabled) {
    const from = config.style_gradient_from || "#6366f1";
    const to = config.style_gradient_to || "#8b5cf6";
    const via = config.style_gradient_via;
    const colorStops = via ? `${from}, ${via}, ${to}` : `${from}, ${to}`;

    if (config.style_gradient_type === "radial") {
      style.background = `radial-gradient(circle, ${colorStops})`;
    } else {
      const angle = config.style_gradient_angle ?? 135;
      style.background = `linear-gradient(${angle}deg, ${colorStops})`;
    }
  }

  if (config.style_text_color) style.color = config.style_text_color;
  if (config.style_border_radius) style.borderRadius = `${config.style_border_radius}px`;
  if (config.style_border_color) style.borderColor = config.style_border_color;
  if (config.style_border_width) {
    style.borderWidth = `${config.style_border_width}px`;
    style.borderStyle = "solid";
  }
  if (config.style_padding) style.padding = `${config.style_padding}px`;
  if (config.style_font_size) style.fontSize = `${config.style_font_size}px`;

  // Typography
  if (config.style_font_family && config.style_font_family !== "default")
    style.fontFamily = config.style_font_family;
  if (config.style_font_weight && config.style_font_weight !== "default")
    style.fontWeight = Number(config.style_font_weight);
  if (config.style_line_height) style.lineHeight = Number(config.style_line_height);
  if (config.style_letter_spacing)
    style.letterSpacing = `${config.style_letter_spacing}px`;
  if (config.style_text_transform)
    style.textTransform = config.style_text_transform as any;
  if (config.style_text_decoration)
    style.textDecoration = config.style_text_decoration;

  // Box Shadow
  if (config.style_shadow_enabled) {
    const x = config.style_shadow_x ?? 0;
    const y = config.style_shadow_y ?? 4;
    const blur = config.style_shadow_blur ?? 10;
    const spread = config.style_shadow_spread ?? 0;
    const color = config.style_shadow_color || `rgba(0,0,0,${config.style_shadow_opacity ?? 0.2})`;
    style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  // Background image
  if (config.style_bg_image) {
    style.backgroundImage = `url(${config.style_bg_image})`;
    style.backgroundSize = config.style_bg_size || "cover";
    style.backgroundPosition = config.style_bg_position || "center";
    style.backgroundRepeat = "no-repeat";
  }

  // Advanced layout fields
  if (config.adv_width) style.width = config.adv_width;
  if (config.adv_max_width) style.maxWidth = config.adv_max_width;
  if (config.adv_overflow) style.overflow = config.adv_overflow as any;
  if (config.adv_text_align) style.textAlign = config.adv_text_align as any;

  // Margins
  if (config.adv_margin_top) style.marginTop = `${config.adv_margin_top}px`;
  if (config.adv_margin_bottom) style.marginBottom = `${config.adv_margin_bottom}px`;
  if (config.adv_margin_left) style.marginLeft = `${config.adv_margin_left}px`;
  if (config.adv_margin_right) style.marginRight = `${config.adv_margin_right}px`;

  // Padding (individual)
  if (config.adv_padding_top) style.paddingTop = `${config.adv_padding_top}px`;
  if (config.adv_padding_bottom) style.paddingBottom = `${config.adv_padding_bottom}px`;
  if (config.adv_padding_left) style.paddingLeft = `${config.adv_padding_left}px`;
  if (config.adv_padding_right) style.paddingRight = `${config.adv_padding_right}px`;

  if (config.adv_z_index) style.zIndex = config.adv_z_index;
  if (config.adv_min_height) style.minHeight = `${config.adv_min_height}px`;

  // Hover transition
  if (config.style_hover_enabled) {
    style.transition = `all ${config.hover_transition_duration ?? 300}ms ease`;
  }

  // Custom CSS (parse inline properties)
  if (config.adv_custom_css) {
    const pairs = config.adv_custom_css.split(";").filter(Boolean);
    for (const pair of pairs) {
      const [prop, ...valParts] = pair.split(":");
      if (prop && valParts.length) {
        const cssProp = prop.trim();
        const val = valParts.join(":").trim();
        // Convert CSS prop to camelCase
        const camelProp = cssProp.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        (style as any)[camelProp] = val;
      }
    }
  }

  return style;
}

export function buildBlockClasses(config: Record<string, any>): string {
  const classes: string[] = [];
  if (config.adv_hide_mobile) classes.push("hidden md:block");
  if (config.adv_hide_desktop) classes.push("md:hidden");
  if (config.adv_css_class) classes.push(config.adv_css_class);
  return classes.join(" ");
}

// Responsive CSS generation for tablet/mobile overrides
const RESPONSIVE_MAP: Array<{ base: string; css: string; unit: string }> = [
  { base: "style_font_size", css: "font-size", unit: "px" },
  { base: "style_line_height", css: "line-height", unit: "" },
  { base: "style_letter_spacing", css: "letter-spacing", unit: "px" },
  { base: "style_padding", css: "padding", unit: "px" },
  { base: "adv_margin_top", css: "margin-top", unit: "px" },
  { base: "adv_margin_bottom", css: "margin-bottom", unit: "px" },
  { base: "adv_margin_left", css: "margin-left", unit: "px" },
  { base: "adv_margin_right", css: "margin-right", unit: "px" },
  { base: "adv_padding_top", css: "padding-top", unit: "px" },
  { base: "adv_padding_bottom", css: "padding-bottom", unit: "px" },
  { base: "adv_padding_left", css: "padding-left", unit: "px" },
  { base: "adv_padding_right", css: "padding-right", unit: "px" },
  { base: "adv_min_height", css: "min-height", unit: "px" },
];

export function buildResponsiveCss(
  className: string,
  config: Record<string, any>
): string {
  const tabletRules: string[] = [];
  const mobileRules: string[] = [];

  for (const { base, css, unit } of RESPONSIVE_MAP) {
    const tabletVal = config[`${base}_tablet`];
    if (tabletVal != null && tabletVal !== "") {
      tabletRules.push(`${css}:${tabletVal}${unit}`);
    }
    const mobileVal = config[`${base}_mobile`];
    if (mobileVal != null && mobileVal !== "") {
      mobileRules.push(`${css}:${mobileVal}${unit}`);
    }
  }

  // Font family for tablet/mobile
  if (config.style_font_family_tablet && config.style_font_family_tablet !== "default") {
    tabletRules.push(`font-family:${config.style_font_family_tablet}`);
  }
  if (config.style_font_family_mobile && config.style_font_family_mobile !== "default") {
    mobileRules.push(`font-family:${config.style_font_family_mobile}`);
  }
  if (config.style_font_weight_tablet && config.style_font_weight_tablet !== "default") {
    tabletRules.push(`font-weight:${config.style_font_weight_tablet}`);
  }
  if (config.style_font_weight_mobile && config.style_font_weight_mobile !== "default") {
    mobileRules.push(`font-weight:${config.style_font_weight_mobile}`);
  }

  // Hover state CSS
  let hoverCss = "";
  if (config.style_hover_enabled) {
    const hoverRules: string[] = [];
    if (config.hover_bg_color) hoverRules.push(`background-color:${config.hover_bg_color}`);
    if (config.hover_text_color) hoverRules.push(`color:${config.hover_text_color}`);
    if (config.hover_border_color) hoverRules.push(`border-color:${config.hover_border_color}`);
    if (config.hover_scale) hoverRules.push(`transform:scale(${config.hover_scale})`);
    if (config.hover_opacity != null) hoverRules.push(`opacity:${config.hover_opacity}`);
    if (config.hover_shadow) hoverRules.push(`box-shadow:${config.hover_shadow}`);
    if (hoverRules.length > 0) {
      hoverCss = `.${className}:hover{${hoverRules.join(";")}}`;
    }
  }

  let css = hoverCss;
  if (tabletRules.length > 0) {
    css += `@media(max-width:1024px){.${className}{${tabletRules.join(";")}}}`;
  }
  if (mobileRules.length > 0) {
    css += `@media(max-width:768px){.${className}{${mobileRules.join(";")}}}`;
  }

  return css;
}
