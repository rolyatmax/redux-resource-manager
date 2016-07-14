"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mapObject = mapObject;
function mapObject(obj, mapFn, target) {
  target = target || {};
  for (var key in obj) {
    target[key] = mapFn(obj[key], key);
  }
  return target;
}