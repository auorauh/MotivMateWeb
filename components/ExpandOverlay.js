import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from '../platform';

const OPEN_MS = 420;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TRANSITION = [
  `top ${OPEN_MS}ms ${EASE}`,
  `left ${OPEN_MS}ms ${EASE}`,
  `width ${OPEN_MS}ms ${EASE}`,
  `height ${OPEN_MS}ms ${EASE}`,
  `background-color ${OPEN_MS}ms ease`,
  `border-radius ${OPEN_MS}ms ease`,
  `box-shadow ${OPEN_MS}ms ease`,
].join(', ');

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function ExpandOverlay({ origin, fromColor, toColor, borderColor, closeLabel, onClose, children }) {
  const sheetRef = useRef(null);
  const skipMotion = !origin || prefersReducedMotion();
  const [open, setOpen] = useState(skipMotion);
  const closing = useRef(false);

  useLayoutEffect(() => {
    const node = sheetRef.current;
    if (!node) return undefined;
    if (skipMotion) {
      setOpen(true);
      return undefined;
    }

    const width = Math.min(440, window.innerWidth * 0.9);
    node.style.visibility = 'hidden';
    node.style.position = 'fixed';
    node.style.left = `${(window.innerWidth - width) / 2}px`;
    node.style.top = '16px';
    node.style.width = `${width}px`;
    node.style.height = 'auto';
    node.style.maxHeight = 'none';
    node.style.overflow = 'hidden';
    const toH = Math.min(Math.max(node.scrollHeight, 280), window.innerHeight * 0.84);
    const toTop = Math.max(16, (window.innerHeight - toH) / 2);
    const toLeft = (window.innerWidth - width) / 2;

    node.style.visibility = 'visible';
    node.style.transition = 'none';
    node.style.top = `${origin.top}px`;
    node.style.left = `${origin.left}px`;
    node.style.width = `${origin.width}px`;
    node.style.height = `${origin.height}px`;
    node.style.borderRadius = '15px';
    node.style.backgroundColor = fromColor || toColor;
    node.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        node.style.transition = TRANSITION;
        node.style.top = `${toTop}px`;
        node.style.left = `${toLeft}px`;
        node.style.width = `${width}px`;
        node.style.height = `${toH}px`;
        node.style.borderRadius = '16px';
        node.style.backgroundColor = toColor;
        node.style.boxShadow = '0 22px 60px rgba(0,0,0,0.28)';
        setOpen(true);
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    const node = sheetRef.current;
    if (skipMotion || !node) {
      onClose();
      return;
    }
    node.style.transition = TRANSITION;
    node.style.top = `${origin.top}px`;
    node.style.left = `${origin.left}px`;
    node.style.width = `${origin.width}px`;
    node.style.height = `${origin.height}px`;
    node.style.borderRadius = '15px';
    node.style.backgroundColor = fromColor || toColor;
    node.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    window.setTimeout(onClose, OPEN_MS);
  }

  return (
    <View style={styles.overlay}>
      <Pressable
        aria-label={closeLabel || 'Close'}
        onPress={requestClose}
        style={[
          styles.scrim,
          {
            opacity: open ? 1 : 0,
            transition: `opacity ${OPEN_MS}ms ease`,
          },
        ]}
      />
      <div
        ref={sheetRef}
        className="mm-expand-sheet"
        style={{
          position: 'fixed',
          zIndex: 1,
          width: '90%',
          maxWidth: 440,
          maxHeight: '84vh',
          border: `1px solid ${borderColor || 'transparent'}`,
          borderRadius: 16,
          overflow: 'hidden',
          background: toColor,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          willChange: 'top, left, width, height',
          visibility: skipMotion ? 'visible' : 'hidden',
        }}
      >
        <div
          style={{
            opacity: open ? 1 : 0,
            transition: open ? 'opacity 200ms ease 90ms' : `opacity 90ms ease`,
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {typeof children === 'function' ? children(requestClose) : children}
        </div>
      </div>
    </View>
  );
}

export default ExpandOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
