const now = Date.now || function _now() {
  return new Date().getTime();
};

export default function debounce(fn, wait, immediate) {
  let timeout;
  let args;
  let context;
  let timestamp;
  let result;

  const later = () => {
    const last = now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = fn.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debouncedFn(...debounceArgs) {
    context = this;
    args = debounceArgs;
    timestamp = now();
    const callNow = immediate && !timeout;

    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = fn.apply(context, args);
      context = args = null;
    }

    return result;
  };
}
