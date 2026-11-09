const UNITLESS = new Set([
  'opacity',
  'zIndex',
  'fontWeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'aspectRatio',
  'order',
]);

function expandShorthand(style) {
  const next = { ...style };
  if (next.marginHorizontal != null) {
    next.marginLeft = next.marginHorizontal;
    next.marginRight = next.marginHorizontal;
    delete next.marginHorizontal;
  }
  if (next.marginVertical != null) {
    next.marginTop = next.marginVertical;
    next.marginBottom = next.marginVertical;
    delete next.marginVertical;
  }
  if (next.paddingHorizontal != null) {
    next.paddingLeft = next.paddingHorizontal;
    next.paddingRight = next.paddingHorizontal;
    delete next.paddingHorizontal;
  }
  if (next.paddingVertical != null) {
    next.paddingTop = next.paddingVertical;
    next.paddingBottom = next.paddingVertical;
    delete next.paddingVertical;
  }
  return next;
}

function resolveAnimated(style) {
  if (style == null || style === false) return null;
  if (typeof style.__getValue === 'function') return style.__getValue();
  if (Array.isArray(style)) return style.map(resolveAnimated);
  if (typeof style !== 'object') return style;
  const resolved = {};
  for (const [key, value] of Object.entries(style)) {
    resolved[key] = resolveAnimated(value);
  }
  return resolved;
}

export function collectAnimatedValues(style, found = []) {
  if (style == null || style === false) return found;
  if (typeof style.__getValue === 'function') {
    found.push(style);
    return found;
  }
  if (Array.isArray(style)) {
    style.forEach((item) => collectAnimatedValues(item, found));
    return found;
  }
  if (typeof style === 'object') {
    Object.values(style).forEach((value) => collectAnimatedValues(value, found));
  }
  return found;
}

function toCss(style) {
  if (!style || typeof style !== 'object' || Array.isArray(style)) return undefined;
  const css = {};
  const shadowOffset = style.shadowOffset || {};
  if (style.shadowColor) {
    const opacity = style.shadowOpacity ?? 0.8;
    css.boxShadow = `${shadowOffset.width || 0}px ${shadowOffset.height || 0}px ${style.shadowRadius || 1}px rgba(0,0,0,${opacity})`;
  }
  if (style.textShadowColor) {
    const offset = style.textShadowOffset || {};
    css.textShadow = `${offset.width || 0}px ${offset.height || 0}px ${style.textShadowRadius || 0}px ${style.textShadowColor}`;
  }
  if (style.resizeMode) css.objectFit = style.resizeMode;

  for (const [key, value] of Object.entries(style)) {
    if (value == null) continue;
    if (
      key === 'shadowColor' ||
      key === 'shadowOffset' ||
      key === 'shadowOpacity' ||
      key === 'shadowRadius' ||
      key === 'elevation' ||
      key === 'textShadowColor' ||
      key === 'textShadowOffset' ||
      key === 'textShadowRadius' ||
      key === 'resizeMode' ||
      key === 'includeFontPadding'
    ) {
      continue;
    }
    if (key === 'transform' && Array.isArray(value)) {
      css.transform = value
        .map((step) => {
          const [prop, amount] = Object.entries(step)[0];
          if (prop === 'translateX' || prop === 'translateY') {
            const unit = typeof amount === 'number' ? `${amount}px` : amount;
            return `${prop}(${unit})`;
          }
          if (prop === 'rotate') return `rotate(${amount})`;
          if (prop === 'scale') return `scale(${amount})`;
          return '';
        })
        .filter(Boolean)
        .join(' ');
      continue;
    }
    if (key === 'fontWeight' && typeof value === 'number') {
      css.fontWeight = String(value);
      continue;
    }
    css[key] = value;
    if (typeof value === 'number' && !UNITLESS.has(key)) {
      css[key] = value;
    }
  }
  if (css.borderWidth && !css.borderStyle) css.borderStyle = 'solid';
  if (css.borderTopWidth && !css.borderTopStyle) css.borderTopStyle = 'solid';
  if (css.borderBottomWidth && !css.borderBottomStyle) css.borderBottomStyle = 'solid';
  if (css.borderLeftWidth && !css.borderLeftStyle) css.borderLeftStyle = 'solid';
  if (css.borderRightWidth && !css.borderRightStyle) css.borderRightStyle = 'solid';
  return css;
}

export function flattenStyle(style) {
  const resolved = resolveAnimated(style);
  const list = Array.isArray(resolved) ? resolved.flat(Infinity) : [resolved];
  const merged = {};
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    Object.assign(merged, expandShorthand(item));
  }
  return toCss(expandShorthand(merged));
}

export const StyleSheet = {
  create(styles) {
    return styles;
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hairlineWidth: 1,
};
