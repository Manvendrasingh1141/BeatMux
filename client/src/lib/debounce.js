// Centralized debounce/throttle utilities

export const debounce = (fn, delayMs) => {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

export const throttle = (fn, limitMs) => {
  let lastCall = 0;
  let rafId = null;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      fn(...args);
    }
  };
};

export const rafThrottle = (fn) => {
  let rafId = null;
  return (...args) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn(...args);
      rafId = null;
    });
  };
};

export const useDebounce = (value, delay) => {
  // React hook version - import separately
  // This is just for export, the hook is in hooks/useDebounce.js
};
