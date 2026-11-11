import { StyleSheet, View, Text, Pressable, Vibration } from '../platform';
import { useEffect, useRef, useState } from 'react';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';

const OPEN_OFFSET = -64;
const DELETE_OFFSET = -150;

function GoalItem(props){
  const [score, setScore] = useState('+ -');
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const slotRef = useRef(null);
  const lastSlot = useRef('');

  function slideTo(value) {
    offsetRef.current = value;
    setOffset(value);
  }
    
    useEffect(() => {
      setPoints();
    },[])

    function setPoints(){
      if(props.value.difficulty == 'Easy'){
        setScore('+ 10');
      } else if(props.value.difficulty == 'Medium'){
        setScore('+ 25');
      } if(props.value.difficulty == 'Hard'){
        setScore('+ 100');
      }
    }

    function onSlideDown(event) {
      if (event.target.closest('[data-reorder]') || event.target.closest('[data-delete]')) return;
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
        props.onDeleteItem(props._id);
        return;
      }
      slideTo(current < -48 ? OPEN_OFFSET : 0);
    }

    return (
    <View
      data-goal-id={props._id}
      data-index={props.index}
      style={[
        styles.reorderWrap,
        props.totalCount - 1 == props.index ? { marginBottom: '7%' } : null,
      ]}
    >
      {props.dropBefore ? <View style={[styles.dropLine, styles.dropLineBefore]} /> : null}
      {props.dropAfter ? <View style={[styles.dropLine, styles.dropLineAfter]} /> : null}
    <View
      style={styles.slideWrap}
      onPointerDown={onSlideDown}
    >
      <View
        aria-label={`Delete ${props.value.title}`}
        data-delete="true"
        role="button"
        style={styles.deleteAction}
        onClick={(event) => {
          event.stopPropagation();
          props.onDeleteItem(props._id);
        }}
      >
        <FontAwesome5 name={'trash'} style={styles.deleteIcon} />
        <TextFont style={styles.deleteText}>Delete</TextFont>
      </View>
    <Pressable
      style={({pressed}) => [
        styles.slideCard,
        { transform: [{ translateX: offset }], transition: dragging ? 'none' : 'transform 160ms ease' },
        pressed && offset === 0 ? styles.pressedItem : null,
      ]}
      onPress={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (offsetRef.current !== 0) {
          slideTo(0);
          return;
        }
        props.complete(props._id);
      }}
    >
        <View style={[
              (props.value.complete? [styles.goalItem,styles.completeGoal] : [styles.goalItem, {backgroundColor: props.theme.primary}])
              ]}>
            <View
              aria-label={`Reorder ${props.value.title}`}
              data-reorder="true"
              role="button"
              style={[styles.moveIcon, { cursor: 'grab', touchAction: 'none' }]}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
                const id = props._id;
                const fromIndex = props.index;
                lastSlot.current = '';
                slotRef.current = null;
                const hover = (ev) => {
                  const under = document.elementFromPoint(ev.clientX, ev.clientY);
                  const row = under && under.closest('[data-goal-id]');
                  let slot = null;
                  if (row) {
                    const toIndex = Number(row.getAttribute('data-index'));
                    const rect = row.getBoundingClientRect();
                    const before = ev.clientY < rect.top + rect.height / 2;
                    const insertAt = before ? toIndex : toIndex + 1;
                    if (insertAt !== fromIndex && insertAt !== fromIndex + 1) {
                      slot = { id: row.getAttribute('data-goal-id'), before };
                    }
                  }
                  const key = slot ? `${slot.id}:${slot.before}` : '';
                  if (key !== lastSlot.current) {
                    lastSlot.current = key;
                    if (slot) Vibration.vibrate(15);
                  }
                  slotRef.current = slot;
                  props.onDragHover(slot);
                };
                const up = () => {
                  window.removeEventListener('pointermove', hover);
                  window.removeEventListener('pointerup', up);
                  const slot = slotRef.current;
                  slotRef.current = null;
                  lastSlot.current = '';
                  props.onDragHover(null);
                  if (slot) props.onReorder(id, slot.id, slot.before);
                };
                window.addEventListener('pointermove', hover);
                window.addEventListener('pointerup', up);
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <FontAwesome5 name={'grip-lines'} />
            </View>
            <View style={styles.goalTextContainer}>
              <TextFont style={styles.goalText}>
                  {props.value.title}
              </TextFont>
              <TextFont>{props.item}</TextFont> 
            </View>
            <View style={styles.streak}>
              {props.value.streak > 0  ?<TextFont style={[{color: 'gray'}]}>Streak {props.value.streak} <FontAwesome5 name={'fire-alt'} /></TextFont>: <><TextFont> </TextFont></>}
            </View>
            <TextFont  style={styles.difficulty}>     
            {props.value.difficulty == "Easy" ? '+ 10' : ''}
            {props.value.difficulty == "Medium" ? '+ 25' : ''}
            {props.value.difficulty == "Hard" ? '+ 100' : ''}
            </TextFont>
            {props.value.difficulty == "Easy" ?
            <View style={[styles.diffColor,styles.easy]}>
            </View> 
            : <></>}
            {props.value.difficulty == "Medium" ?
            <View style={[styles.diffColor,styles.medium]}>
            </View> 
            : <></>}
            {props.value.difficulty == "Hard" ?
            <View style={[styles.diffColor,styles.hard]}>
            </View> 
            : <></>}

        </View>
    </Pressable>
    </View>
    </View>
    )

}

export default GoalItem;

const styles = StyleSheet.create({
    reorderWrap: {
        position: 'relative',
        width: '100%',
    },
    dropLine: {
        position: 'absolute',
        left: 16,
        right: 16,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#706860',
        zIndex: 3,
    },
    dropLineBefore: {
        top: -9,
    },
    dropLineAfter: {
        bottom: -9,
    },
    slideWrap: {
        position: 'relative',
        width: '100%',
        height: 72,
        borderRadius: 15,
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
        fontSize: 16,
    },
    deleteText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    goalItem:{
        height: 72,
        width: '100%',
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        justifyContent: 'space-between'
      },
      goalTextContainer: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        alignSelf: 'flex-start'
      },
      goalText: {
        fontSize: 22,
      },
      moveIcon: {
        fontSize: 20,
        height: '100%',
        width: '15%',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        flexDirection: 'row'
      },
      streak: {
        height: '100%',
        justifyContent: 'center',
        width: '20%'
      },
      difficulty: {
        width: '10%',
        textAlign: 'center'
      },
      diffColor:{
        height: '100%',
        width: '4%',
      },
      pressedItem: {
        opacity: .3,
      },
      completeGoal: {
        backgroundColor: '#0CCA4A'
      },
      easy: {
        backgroundColor: '#58cc02',
      },
      medium: {
        backgroundColor: '#FFC107',
      },
      hard: {
        backgroundColor: 'red',
      }
})