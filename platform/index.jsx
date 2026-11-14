import { useEffect, useRef, useState } from 'react';
import { Animated } from './animated';
import { collectAnimatedValues, flattenStyle, StyleSheet } from './styles';

export { StyleSheet, flattenStyle };

function boxStyle(style) {
  return {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    minWidth: 0,
    ...flattenStyle(style),
  };
}

export function View({ style, children, ...rest }) {
  return (
    <div style={boxStyle(style)} {...domProps(rest)}>
      {children}
    </div>
  );
}

export function Text({ style, children, ...rest }) {
  return (
    <span style={flattenStyle(style)} {...domProps(rest)}>
      {children}
    </span>
  );
}

export function TextInput({
  style,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  secureTextEntry,
  selectionColor,
  autoFocus,
  onBlur,
  onFocus,
  onSubmitEditing,
  inputMode,
  type,
  multiline,
  numberOfLines,
  ...rest
}) {
  const shared = {
    value,
    placeholder,
    autoFocus,
    onFocus,
    onBlur,
    onChange: (event) => onChangeText?.(event.target.value),
    style: {
      fontFamily: 'inherit',
      background: 'transparent',
      outline: 'none',
      caretColor: selectionColor,
      ...flattenStyle(style),
      ...(placeholderTextColor ? { '--placeholder': placeholderTextColor } : null),
      ...(multiline ? { resize: 'vertical' } : null),
    },
    ...domProps(rest),
  };
  if (multiline) {
    return (
      <textarea
        rows={numberOfLines || 3}
        {...shared}
      />
    );
  }
  return (
    <input
      type={secureTextEntry ? 'password' : (type || 'text')}
      inputMode={inputMode}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSubmitEditing?.(event);
      }}
      {...shared}
    />
  );
}

export function Image({ source, style, alt = '' }) {
  const src = typeof source === 'string' ? source : source?.uri || '';
  if (!src) return null;
  return <img src={src} alt={alt} style={flattenStyle(style)} />;
}

export function ScrollView({ style, children }) {
  return (
    <div style={{ overflow: 'auto', ...flattenStyle(style) }}>
      {children}
    </div>
  );
}

export function FlatList({
  data = [],
  renderItem,
  keyExtractor,
  horizontal,
  ItemSeparatorComponent,
  style,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        overflowX: horizontal ? 'auto' : 'visible',
        ...flattenStyle(style),
      }}
    >
      {data.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item, index) : index} style={horizontal ? { flex: '0 0 auto' } : undefined}>
          {index > 0 && ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
          {renderItem?.({ item, index })}
        </div>
      ))}
    </div>
  );
}

export function Pressable({
  style,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}) {
  const [pressed, setPressed] = useState(false);
  const timer = useRef(null);
  const longFired = useRef(false);
  const resolved = typeof style === 'function' ? style({ pressed }) : style;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <div
      {...domProps(rest)}
      role="button"
      aria-disabled={disabled || undefined}
      style={{
        ...boxStyle(resolved),
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
      }}
      onPointerDown={() => {
        if (disabled) return;
        setPressed(true);
        longFired.current = false;
        onPressIn?.();
        if (onLongPress) {
          timer.current = setTimeout(() => {
            longFired.current = true;
            onLongPress();
          }, 550);
        }
      }}
      onPointerUp={() => {
        setPressed(false);
        clearTimer();
        onPressOut?.();
      }}
      onPointerLeave={() => {
        if (!pressed) return;
        setPressed(false);
        clearTimer();
        onPressOut?.();
      }}
      onClick={() => {
        if (disabled || longFired.current) {
          longFired.current = false;
          return;
        }
        onPress?.();
      }}
    >
      {children}
    </div>
  );
}

export function TouchableOpacity(props) {
  return <Pressable {...props} />;
}

export function TouchableWithoutFeedback({ children }) {
  return (
    <div
      style={{ flex: 1, minHeight: 0, width: '100%' }}
      onPointerDown={(event) => {
        const tag = event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
        document.activeElement?.blur?.();
      }}
    >
      {children}
    </div>
  );
}

export function Button({ title, onPress, color = '#222' }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        color,
        background: 'transparent',
        border: 'none',
        font: 'inherit',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
      }}
    >
      {title}
    </button>
  );
}

export function Switch({ value, onValueChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!value}
      onClick={() => onValueChange?.(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        border: 'none',
        padding: 3,
        background: value ? '#00bcd4' : '#3e3e3e',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          display: 'block',
          width: 22,
          height: 22,
          borderRadius: 11,
          background: '#fff',
          transform: value ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 160ms ease',
        }}
      />
    </button>
  );
}

export function ActivityIndicator({ color = '#111', size = 'small' }) {
  const px = size === 'large' ? 36 : 22;
  return (
    <span
      className="mm-spinner"
      style={{ width: px, height: px, borderTopColor: color }}
    />
  );
}

export function Modal({ children, animationType, className }) {
  const names = [animationType === 'slide' ? 'mm-modal mm-modal-slide' : 'mm-modal', className].filter(Boolean);
  return (
    <div className={names.join(' ')}>
      {children}
    </div>
  );
}

function AnimatedView({ style, children }) {
  const [, setFrame] = useState(0);
  useEffect(() => {
    const values = collectAnimatedValues(style);
    const listener = () => setFrame((frame) => frame + 1);
    values.forEach((value) => value.addListener(listener));
    return () => values.forEach((value) => value.removeListener(listener));
  });
  return <div style={boxStyle(style)}>{children}</div>;
}

Animated.View = AnimatedView;
export { Animated };

const listeners = new Set();

export const AppState = {
  addEventListener(_type, handler) {
    const wrapped = () => {
      handler(document.visibilityState === 'visible' ? 'active' : 'background');
    };
    wrapped._handler = handler;
    document.addEventListener('visibilitychange', wrapped);
    listeners.add(wrapped);
    return {
      remove() {
        document.removeEventListener('visibilitychange', wrapped);
        listeners.delete(wrapped);
      },
    };
  },
  removeEventListener(_type, handler) {
    for (const wrapped of listeners) {
      if (wrapped._handler === handler) {
        document.removeEventListener('visibilitychange', wrapped);
        listeners.delete(wrapped);
      }
    }
  },
};

export const Keyboard = {
  dismiss() {
    document.activeElement?.blur?.();
  },
};

export const Vibration = {
  vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  },
  cancel() {
    if (navigator.vibrate) navigator.vibrate(0);
  },
};

function domProps(rest) {
  const next = {};
  for (const [key, value] of Object.entries(rest)) {
    if (key === 'accessible' || key === 'pointerEvents') continue;
    next[key] = value;
  }
  return next;
}
