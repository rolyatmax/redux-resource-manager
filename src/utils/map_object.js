export default function mapObject(obj, mapFn, target) {
  target = target || {};
  // FIXME: linting problem here
  for (let key in obj) { // eslint-disable-line
    target[key] = mapFn(obj[key], key);
  }
  return target;
}
