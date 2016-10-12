/* @flow */

/*
 * Adapted from underscore.js 1.8.3
 * "immediate" logic here is for covering edge cases
 */
export default function debounce(
    fn: (...args: any) => void,
    wait: number,
    immediate: ?bool):(...args: any) => void {
  let timeout;
  let args;
  let context;
  let timestamp;
  let result;

  const later = () => {
    const last = Date.now() - timestamp;

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
    timestamp = Date.now();
    const callNow = immediate && !timeout;

    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = fn.apply(context, args);
      context = args = null;
    }

    return result;
  };
}
