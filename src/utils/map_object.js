export default function mapObject(obj, mapFn, target) {
  target = target || {};
  for (let key in obj) {
    target[key] = mapFn(obj[key], key);
  }
  return target;
}
