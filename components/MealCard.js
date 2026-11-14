import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Vibration, View } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';

const OPEN_OFFSET = -64;
const DELETE_OFFSET = -150;

const SLOT_TONE = {
  breakfast: '#f0b45a',
  lunch: '#58cc02',
  dinner: '#3aa7b8',
  snack: '#e2b340',
};

function MealCard({ meal, theme, onToggle, onView, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const cooked = Boolean(meal.cooked);
  const tone = SLOT_TONE[meal.slot] || theme.primary;

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
      onDelete(meal.id);
      return;
    }
    slideTo(current < -48 ? OPEN_OFFSET : 0);
  }

  return (
    <View style={styles.slideWrap} onPointerDown={onSlideDown}>
      <View
        aria-label={`Delete ${meal.title}`}
        data-delete="true"
        role="button"
        style={styles.deleteAction}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(meal.id);
        }}
      >
        <FontAwesome5 name="trash" style={styles.deleteIcon} />
        <TextFont style={styles.deleteText}>Delete</TextFont>
      </View>
      <Pressable
        data-meal-card={meal.id}
        aria-label={cooked ? `Unmark ${meal.title} cooked` : `Mark ${meal.title} cooked`}
        style={({ pressed }) => [
          styles.slideCard,
          { transform: [{ translateX: offset }], transition: dragging ? 'none' : 'transform 160ms ease' },
          pressed && offset === 0 ? styles.pressed : null,
        ]}
        onLongPress={() => {
          if (offsetRef.current !== 0) return;
          Vibration.vibrate(18);
          const node = document.querySelector(`[data-meal-card="${meal.id}"]`);
          const box = node?.getBoundingClientRect();
          const origin = box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null;
          onView?.({ meal, origin });
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
          onToggle(meal.id);
        }}
      >
        <View style={[styles.item, cooked ? styles.cookedItem : { backgroundColor: theme.primary }]}>
          <View style={[styles.accent, { backgroundColor: tone }]} />
          <View style={styles.copy}>
            <TextFont style={styles.title}>{meal.title}</TextFont>
            <TextFont style={styles.hint}>
              {cooked ? 'cooked · hold to edit' : 'hold to view'}
              {meal.calories ? ` · ${meal.calories}` : ''}
            </TextFont>
          </View>
          <View style={[styles.check, cooked ? styles.checkOn : null]}>
            {cooked ? <FontAwesome5 name="check" style={styles.checkIcon} /> : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default MealCard;

const styles = StyleSheet.create({
  slideWrap: {
    position: 'relative',
    width: '100%',
    height: 64,
    borderRadius: 14,
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
    height: 64,
    width: '100%',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cookedItem: {
    backgroundColor: '#0CCA4A',
  },
  accent: {
    width: 8,
    height: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hint: {
    fontSize: 11,
    color: 'gray',
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.28)',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: '#241f33',
    borderColor: '#241f33',
  },
  checkIcon: {
    color: '#fff9ef',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.3,
  },
});
