import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Vibration, View } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';

const OPEN_OFFSET = -64;
const DELETE_OFFSET = -150;

function GroceryItem({ item, theme, onToggle, onView, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);

  function slideTo(value) {
    offsetRef.current = value;
    setOffset(value);
  }

  function onSlideDown(event) {
    if (event.target.closest('[data-delete]')) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      axis: null,
      start: offsetRef.current,
    };
    setDragging(true);
    const move = (ev) => onSlideMove(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      onSlideUp();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function onSlideMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (drag.axis !== 'x') return;
    slideTo(Math.min(0, Math.max(DELETE_OFFSET - 40, drag.start + dx)));
  }

  function onSlideUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag || !drag.axis) return;
    suppressClick.current = true;
    if (drag.axis !== 'x') return;
    const current = offsetRef.current;
    if (current <= DELETE_OFFSET) {
      onDelete(item.id);
      return;
    }
    slideTo(current < -48 ? OPEN_OFFSET : 0);
  }

  return (
    <View style={styles.slideWrap} onPointerDown={onSlideDown}>
      <View
        aria-label={`Delete ${item.title}`}
        data-delete="true"
        role="button"
        style={styles.deleteAction}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(item.id);
        }}
      >
        <FontAwesome5 name="trash" style={styles.deleteIcon} />
        <TextFont style={styles.deleteText}>Delete</TextFont>
      </View>
      <Pressable
        data-grocery-card={item.id}
        aria-label={item.complete ? `Uncheck ${item.title}` : `Check off ${item.title}`}
        style={({ pressed }) => [
          styles.slideCard,
          { transform: [{ translateX: offset }], transition: dragging ? 'none' : 'transform 160ms ease' },
          pressed && offset === 0 ? styles.pressedItem : null,
        ]}
        onLongPress={() => {
          if (offsetRef.current !== 0) return;
          Vibration.vibrate(18);
          const node = document.querySelector(`[data-grocery-card="${item.id}"]`);
          const box = node?.getBoundingClientRect();
          const origin = box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null;
          onView?.({ item, origin });
        }}
        onPress={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (offsetRef.current !== 0) {
            slideTo(0);
            return;
          }
          onToggle(item.id);
        }}
      >
        <View style={[
          styles.item,
          item.complete ? styles.completeItem : { backgroundColor: theme.primary },
        ]}
        >
          <View style={styles.moveIcon}>
            <FontAwesome5 name="grip-lines" />
          </View>
          <View style={styles.itemText}>
            <View style={styles.itemCopy}>
              <TextFont style={styles.title}>{item.title}</TextFont>
              <TextFont style={styles.holdHint}>hold to view</TextFont>
            </View>
          </View>
          <TextFont style={styles.amount}>{item.amount}</TextFont>
          <View style={[styles.diffColor, item.aisle === 'Produce' ? styles.produce : styles.aisle]} />
        </View>
      </Pressable>
    </View>
  );
}

export default GroceryItem;

const styles = StyleSheet.create({
  slideWrap: {
    position: 'relative',
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    touchAction: 'pan-y',
  },
  slideCard: {
    width: '100%',
    height: '100%',
    touchAction: 'pan-y',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: '#d64545',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  deleteIcon: {
    color: '#fff',
    fontSize: 14,
  },
  deleteText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 2,
  },
  item: {
    height: 56,
    width: '100%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  moveIcon: {
    fontSize: 16,
    height: '100%',
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    fontSize: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  holdHint: {
    fontSize: 11,
    color: 'gray',
    marginTop: 1,
  },
  amount: {
    width: '22%',
    textAlign: 'center',
    fontSize: 14,
    color: 'gray',
  },
  diffColor: {
    height: '100%',
    width: '4%',
  },
  produce: {
    backgroundColor: '#58cc02',
  },
  aisle: {
    backgroundColor: '#FFC107',
  },
  completeItem: {
    backgroundColor: '#0CCA4A',
  },
  pressedItem: {
    opacity: 0.3,
  },
});
