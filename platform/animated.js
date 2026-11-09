export class AnimatedValue {
  constructor(value) {
    this._value = value;
    this._listeners = new Set();
  }

  setValue(value) {
    this._value = value;
    this._listeners.forEach((listener) => listener(value));
  }

  __getValue() {
    return this._value;
  }

  addListener(listener) {
    this._listeners.add(listener);
    return listener;
  }

  removeListener(listener) {
    this._listeners.delete(listener);
  }
}

function timing(value, config) {
  const toValue = config?.toValue ?? 0;
  const duration = config?.duration ?? 300;
  let frame;
  return {
    start(callback) {
      const from = value.__getValue();
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        value.setValue(from + (toValue - from) * t);
        if (t < 1) frame = requestAnimationFrame(step);
        else callback?.({ finished: true });
      };
      frame = requestAnimationFrame(step);
    },
    stop() {
      if (frame) cancelAnimationFrame(frame);
    },
  };
}

function parallel(animations) {
  return {
    start(callback) {
      if (!animations.length) {
        callback?.({ finished: true });
        return;
      }
      let remaining = animations.length;
      animations.forEach((animation) => {
        animation.start(() => {
          remaining -= 1;
          if (remaining === 0) callback?.({ finished: true });
        });
      });
    },
    stop() {
      animations.forEach((animation) => animation.stop?.());
    },
  };
}

function sequence(animations) {
  return {
    start(callback) {
      const run = (index) => {
        if (index >= animations.length) {
          callback?.({ finished: true });
          return;
        }
        animations[index].start(() => run(index + 1));
      };
      run(0);
    },
    stop() {
      animations.forEach((animation) => animation.stop?.());
    },
  };
}

export const Animated = {
  Value: AnimatedValue,
  View: null,
  timing,
  spring(value, config) {
    return timing(value, { toValue: config?.toValue ?? 0, duration: 320 });
  },
  parallel,
  sequence,
};
