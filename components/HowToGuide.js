import { useLayoutEffect, useState } from 'react';
import TextFont from './TextFont';

export const TOUR_STEPS = [
  {
    target: 'score',
    title: 'Your score',
    body: 'Points for goals you complete today sit up here. Easy is +10, Medium +25, Hard +100.',
    shape: 'round',
    show: 'goals',
  },
  {
    target: 'goals',
    title: 'Goals',
    body: 'Your list. All shows everything. Daily is habits. To Do is one-off tasks. Tap to complete, hold the grip to reorder, slide left to delete.',
    shape: 'round',
    show: 'goals',
  },
  {
    target: 'progress',
    title: 'Progress',
    body: 'Today’s completion, 14 days of scores, this week’s calories, and which daily goals you have actually done. Tracker opens the calorie log.',
    shape: 'round',
    show: 'progress',
  },
  {
    target: 'add',
    title: 'Add a goal',
    body: 'Goal Wizard walks you through a new goal. Custom goal lets you type your own and pick Daily or To Do.',
    shape: 'circle',
    show: 'goals',
  },
  {
    target: 'you',
    title: 'You',
    body: 'Your stats, grocery lists, meal plan, calorie tracker, and health records. Tap a health record to log a new best.',
    shape: 'round',
    show: 'you',
  },
  {
    target: 'settings',
    title: 'Settings',
    body: 'Pick a color, turn on push reminders, or hold Reset Score to clear today’s points. Log Out signs you out on this device.',
    shape: 'round',
    show: 'settings',
  },
];

function measureTarget(id) {
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  const pad = 8;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

function HowToGuide({ step, onNext, onPrev, onClose }) {
  const [hole, setHole] = useState(null);
  const current = TOUR_STEPS[step];
  const last = step >= TOUR_STEPS.length - 1;

  useLayoutEffect(() => {
    if (!current) return undefined;
    let alive = true;
    const update = () => {
      if (!alive) return;
      setHole(measureTarget(current.target));
    };
    update();
    const delays = [40, 160].map((ms) => window.setTimeout(update, ms));
    window.addEventListener('resize', update);
    return () => {
      alive = false;
      delays.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', update);
    };
  }, [step, current]);

  if (!current) return null;

  const root = document.getElementById('root')?.getBoundingClientRect();
  const cardLeft = root ? root.left + 18 : 18;
  const cardWidth = root ? root.width - 36 : 320;
  const holeBottom = hole ? hole.top + hole.height : 0;
  const placeAbove = hole && hole.top > 240;
  const cardStyle = placeAbove
    ? { left: cardLeft, width: cardWidth, bottom: window.innerHeight - hole.top + 14 }
    : { left: cardLeft, width: cardWidth, top: (hole ? holeBottom + 14 : 96) };

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="How to use walkthrough"
      style={styles.overlay}
      onClick={(event) => event.stopPropagation()}
    >
      {hole ? (
        <div
          style={{
            ...styles.hole,
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: current.shape === 'circle' ? 999 : 16,
          }}
        />
      ) : (
        <div style={styles.fullDim} />
      )}
      <div style={{ ...styles.card, ...cardStyle }}>
        <TextFont style={styles.kicker}>
          {step + 1} of {TOUR_STEPS.length}
        </TextFont>
        <TextFont style={styles.title}>{current.title}</TextFont>
        <TextFont style={styles.body}>{current.body}</TextFont>
        <div style={styles.row}>
          <button type="button" style={styles.textBtn} onClick={onClose}>
            Skip
          </button>
          <div style={styles.rowEnd}>
            {step > 0 ? (
              <button type="button" style={styles.textBtn} onClick={onPrev}>
                Back
              </button>
            ) : null}
            <button type="button" style={styles.nextBtn} onClick={last ? onClose : onNext}>
              {last ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowToGuide;

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 80,
  },
  fullDim: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.62)',
  },
  hole: {
    position: 'fixed',
    boxShadow: '0 0 0 3px #fff9ef, 0 0 0 9999px rgba(0,0,0,0.62)',
  },
  card: {
    position: 'fixed',
    zIndex: 81,
    display: 'flex',
    flexDirection: 'column',
    background: '#fff9ef',
    color: '#241f33',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#6d6578',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowEnd: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  textBtn: {
    border: 'none',
    background: 'transparent',
    color: '#6d6578',
    font: 'inherit',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 4px',
  },
  nextBtn: {
    border: 'none',
    background: '#241f33',
    color: '#fff9ef',
    font: 'inherit',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 10,
    padding: '8px 16px',
  },
};
