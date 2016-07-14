'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = fetchJSON;
function fetchJSON(url) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var requestOptions = _extends({
    credentials: 'same-origin'
  }, options);

  return fetch(url, requestOptions).then(function (response) {
    if (response.status < 200 || response.status >= 400) {
      throw new Error(response.status + ' response from ' + url);
    }
    return response.json();
  });
}