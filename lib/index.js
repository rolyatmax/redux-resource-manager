'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = applyResourceManager;

var _redux = require('redux');

var _underscore = require('underscore');

var _fetch_json = require('./utils/fetch_json');

var _fetch_json2 = _interopRequireDefault(_fetch_json);

var _map_object = require('./utils/map_object');

var _map_object2 = _interopRequireDefault(_map_object);

var _identity = require('./utils/identity');

var _identity2 = _interopRequireDefault(_identity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } // TODO: implement this in utils

var RESOURCE_FETCH = 'RESOURCE_FETCH';
var RESOURCE_RECEIVED = 'RESOURCE_RECEIVED';
var RESOURCE_ERROR = 'RESOURCE_ERROR';

var userState = '__userState';
var resourceManagerState = '__resourceManagerState';

function applyResourceManager(resources) {
  var resourceConfigs = applyDefaults(resources);
  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var _reducers;

      var reducers = (_reducers = {}, _defineProperty(_reducers, userState, reducer), _defineProperty(_reducers, resourceManagerState, createResourceManagerReducer(resourceConfigs)), _reducers);
      reducer = (0, _redux.combineReducers)(reducers);
      var store = createStore(reducer, preloadedState, enhancer);
      var get = (0, _map_object2.default)(resourceConfigs, function (config) {
        return createResourceGetter(config, store);
      });
      var wrappedStore = _extends({}, store, {
        get: get,
        getState: function wrappedGetState() {
          var state = store.getState();
          return _extends({}, state[userState], _defineProperty({}, resourceManagerState, state[resourceManagerState]));
        }
      });
      return wrappedStore;
    };
  };
}

function createResourceManagerReducer(resourceConfigs) {
  return (0, _redux.combineReducers)((0, _map_object2.default)(resourceConfigs, function (config) {
    return createResourceReducer(config);
  }));
}

function createResourceGetter(resourceConfig, store) {
  var createCacheKey = resourceConfig.createCacheKey;
  var resourceName = resourceConfig.resourceName;
  var getState = store.getState;
  var dispatch = store.dispatch;

  return function (opts) {
    var state = getState()[resourceManagerState][resourceName];
    var key = createCacheKey(opts);
    if (!state[key] || Date.now() > state[key].expiration) {
      fetchResource(resourceConfig, opts, dispatch);
    }
    return state[key] || { status: 'pending' };
  };
}

function applyDefaults(definitions) {
  return (0, _map_object2.default)(definitions, function (config, name) {
    return _extends({}, config, {
      resourceName: name,
      createCacheKey: config.createCacheKey || createDefaultCacheKey(config),
      parseResponse: config.parseResponse || _identity2.default
    });
  });
}

function createDefaultCacheKey(resourceConfig) {
  return function defaultCacheKey(opts) {
    var _getUrlAndFetchOption = getUrlAndFetchOptions(resourceConfig, opts);

    var url = _getUrlAndFetchOption.url;

    return url;
  };
}

function getUrlAndFetchOptions(resourceConfig, opts) {
  var buildUrl = resourceConfig.buildUrl;

  var buildUrlResult = buildUrl(opts);
  if (typeof buildUrlResult === 'string') {
    return {
      url: buildUrlResult,
      fetchOptions: {}
    };
  }
  var url = buildUrlResult.url;

  var fetchOptions = _objectWithoutProperties(buildUrlResult, ['url']);

  return { url: url, fetchOptions: fetchOptions };
}

var fetchResource = function () {
  var queue = {};
  var fetchInBatch = (0, _underscore.debounce)(function (resourceConfig, dispatch) {
    var buildBatches = resourceConfig.buildBatches;
    var resourceName = resourceConfig.resourceName;

    var batches = buildBatches(queue[resourceName].slice());
    batches.forEach(function (batch) {
      var _getUrlAndFetchOption2 = getUrlAndFetchOptions(resourceConfig, batch);

      var url = _getUrlAndFetchOption2.url;
      var fetchOptions = _getUrlAndFetchOption2.fetchOptions;

      var request = batch.map(function (opts) {
        var retry = function retry() {
          return fetchResource(resourceConfig, opts, dispatch);
        };
        return { opts: opts, retry: retry };
      });
      sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
    });
    queue[resourceName] = [];
  }, 50); // TODO: make this batching buffer configurable?

  return function (resourceConfig, opts, dispatch) {
    var buildBatches = resourceConfig.buildBatches;
    var resourceName = resourceConfig.resourceName;

    if (buildBatches) {
      queue[resourceName] = queue[resourceName] || [];
      queue[resourceName].push(opts);
      fetchInBatch(resourceConfig, dispatch);
    } else {
      var retry = function retry() {
        return fetchResource(resourceConfig, opts, dispatch);
      };

      var _getUrlAndFetchOption3 = getUrlAndFetchOptions(resourceConfig, opts);

      var url = _getUrlAndFetchOption3.url;
      var fetchOptions = _getUrlAndFetchOption3.fetchOptions;

      var request = { opts: opts, retry: retry };
      sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
    }
  };
}();

function sendRequest(resourceConfig, url, fetchOptions, request, dispatch) {
  var resourceName = resourceConfig.resourceName;

  function success(response) {
    dispatch(resourceReceived({ resourceName: resourceName, request: request, response: response }));
  }
  function fail() {
    dispatch(resourceError({ resourceName: resourceName, request: request }));
  }

  (0, _fetch_json2.default)(url, fetchOptions).then(success, fail);
  dispatch(resourceFetch({ resourceName: resourceName, request: request }));
}

/////// actions

function resourceFetch(_ref) {
  var resourceName = _ref.resourceName;
  var request = _ref.request;

  var type = RESOURCE_FETCH;
  return { type: type, resourceName: resourceName, request: request };
}

function resourceReceived(_ref2) {
  var resourceName = _ref2.resourceName;
  var request = _ref2.request;
  var response = _ref2.response;

  var type = RESOURCE_RECEIVED;
  return { type: type, resourceName: resourceName, request: request, response: response };
}

function resourceError(_ref3) {
  var resourceName = _ref3.resourceName;
  var request = _ref3.request;

  var type = RESOURCE_ERROR;
  return { type: type, resourceName: resourceName, request: request };
}

////////// createResourceReducer

function createResourceReducer(resourceConfig) {
  var resourceName = resourceConfig.resourceName;
  var ttl = resourceConfig.ttl;
  var createCacheKey = resourceConfig.createCacheKey;
  var parseResponse = resourceConfig.parseResponse;
  var buildBatches = resourceConfig.buildBatches;

  return function resourceReducer() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var action = arguments[1];

    if (action.resourceName !== resourceName) {
      return state;
    }

    var cacheToUpdate = {};
    var optsList = void 0;
    switch (action.type) {
      case RESOURCE_FETCH:
        optsList = buildBatches ? action.request : [action.request];
        optsList.forEach(function (_ref4) {
          var opts = _ref4.opts;

          cacheToUpdate[createCacheKey(opts)] = { status: 'pending' };
        });
        return _extends({}, state, cacheToUpdate);
      case RESOURCE_RECEIVED:
        var joinedRequestResponse = void 0;
        if (buildBatches) {
          joinedRequestResponse = action.request.map(function (_ref5) {
            var opts = _ref5.opts;
            var retry = _ref5.retry;
            return {
              request: { opts: opts, retry: retry },
              response: parseResponse(opts, action.response)
            };
          });
        } else {
          joinedRequestResponse = [{
            request: action.request,
            response: parseResponse(action.response)
          }];
        }
        joinedRequestResponse.forEach(function (_ref6) {
          var request = _ref6.request;
          var response = _ref6.response;

          cacheToUpdate[createCacheKey(request.opts)] = {
            result: response,
            status: 'fulfilled',
            expiration: Date.now() + ttl
          };
        });
        return _extends({}, state, cacheToUpdate);
      case RESOURCE_ERROR:
        optsList = buildBatches ? action.request : [action.request];
        optsList.forEach(function (_ref7) {
          var opts = _ref7.opts;
          var retry = _ref7.retry;

          cacheToUpdate[createCacheKey(opts)] = {
            status: 'rejected',
            retry: retry
          };
        });
        return _extends({}, state, cacheToUpdate);
      default:
        return state;
    }
  };
}