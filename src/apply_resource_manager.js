import { combineReducers } from 'redux';
import { debounce } from 'underscore'; // TODO: implement this in utils

import fetchJSON from './utils/fetch_json';
import mapObject from './utils/map_object';
import identity from './utils/identity';


const RESOURCE_FETCH = 'RESOURCE_FETCH';
const RESOURCE_RECEIVED = 'RESOURCE_RECEIVED';
const RESOURCE_ERROR = 'RESOURCE_ERROR';

const userState = '__userState';
const resourceManagerState = '__resourceManagerState';

export default function applyResourceManager(resources) {
  const resourceConfigs = applyDefaults(resources);
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const reducers = {
      [userState]: reducer,
      [resourceManagerState]: createResourceManagerReducer(resourceConfigs),
    };
    reducer = combineReducers(reducers);
    const store = createStore(reducer, preloadedState, enhancer);
    const getResources = mapObject(
      resourceConfigs, (config) => createResourceGetter(config, store)
    );
    const wrappedStore = {
      ...store,
      getResources,
      getState: function wrappedGetState() {
        const state = store.getState();
        return {
          ...state[userState],
          [resourceManagerState]: state[resourceManagerState],
        };
      },
    };
    return wrappedStore;
  };
}

function createResourceManagerReducer(resourceConfigs) {
  return combineReducers(mapObject(resourceConfigs, (config) => createResourceReducer(config)));
}

function createResourceGetter(resourceConfig, store) {
  const { createCacheKey, resourceName } = resourceConfig;
  const { getState, dispatch } = store;
  return (params) => {
    const state = getState()[resourceManagerState][resourceName];
    const key = createCacheKey(params);
    if (!state[key] || Date.now() > state[key].expiration) {
      fetchResource(resourceConfig, params, dispatch);
    }
    return state[key] || { status: 'pending' };
  };
}

function applyDefaults(definitions) {
  return mapObject(definitions, (config, name) => ({
    ...config,
    resourceName: name,
    createCacheKey: config.createCacheKey || createDefaultCacheKey(config),
    parseResponse: config.parseResponse || identity,
  }));
}

function createDefaultCacheKey(resourceConfig) {
  return function defaultCacheKey(params) {
    const { url } = getUrlAndFetchOptions(resourceConfig, params);
    return url;
  };
}

function getUrlAndFetchOptions(resourceConfig, params) {
  const { buildUrl } = resourceConfig;
  const buildUrlResult = buildUrl(params);
  if (typeof buildUrlResult === 'string') {
    return {
      url: buildUrlResult,
      fetchOptions: {},
    };
  }
  const { url, ...fetchOptions } = buildUrlResult;
  return { url, fetchOptions };
}

const fetchResource = (() => {
  const queue = {};
  const fetchInBatch = debounce((resourceConfig, dispatch) => {
    const { buildBatches, resourceName } = resourceConfig;
    const batches = buildBatches(queue[resourceName].slice());
    batches.forEach((batch) => {
      const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, batch);
      const request = batch.map((params) => {
        const retry = () => fetchResource(resourceConfig, params, dispatch);
        return { params, retry };
      });
      sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
    });
    queue[resourceName] = [];
  }, 50); // TODO: make this batching buffer configurable?

  return (resourceConfig, params, dispatch) => {
    const { buildBatches, resourceName } = resourceConfig;
    if (buildBatches) {
      queue[resourceName] = queue[resourceName] || [];
      queue[resourceName].push(params);
      fetchInBatch(resourceConfig, dispatch);
    } else {
      const retry = () => fetchResource(resourceConfig, params, dispatch);
      const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, params);
      const request = { params, retry };
      sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
    }
  };
})();

function sendRequest(resourceConfig, url, fetchOptions, request, dispatch) {
  const { resourceName } = resourceConfig;
  function success(response) {
    dispatch(resourceReceived({ resourceName, request, response }));
  }
  function fail(error) {
    console.error(`redux-resource-manager error from ${resourceName}:`, error);
    dispatch(resourceError({ resourceName, request, error }));
  }

  fetchJSON(url, fetchOptions).then(success, fail);
  dispatch(resourceFetch({ resourceName, request }));
}

// //////////////////// actions

function resourceFetch({ resourceName, request }) {
  const type = RESOURCE_FETCH;
  return { type, resourceName, request };
}

function resourceReceived({ resourceName, request, response }) {
  const type = RESOURCE_RECEIVED;
  return { type, resourceName, request, response };
}

function resourceError({ resourceName, request }) {
  const type = RESOURCE_ERROR;
  return { type, resourceName, request };
}

// //////////////// createResourceReducer

function createResourceReducer(resourceConfig) {
  const {
    resourceName, ttl, createCacheKey, parseResponse, buildBatches, unbatchResponse,
  } = resourceConfig;
  return function resourceReducer(state = {}, action) {
    if (action.resourceName !== resourceName) {
      return state;
    }

    const cacheToUpdate = {};
    let paramsList;
    switch (action.type) {
      case RESOURCE_FETCH:
        paramsList = buildBatches ? action.request : [action.request];
        paramsList.forEach(({ params }) => {
          cacheToUpdate[createCacheKey(params)] = { status: 'pending' };
        });
        return { ...state, ...cacheToUpdate };

      // FIXME: figure out why eslint is messed up here
      case RESOURCE_RECEIVED: // eslint-disable-line
        if (!buildBatches) {
          cacheToUpdate[createCacheKey(action.request.params)] = {
            result: parseResponse(action.response),
            status: 'fulfilled',
            expiration: Date.now() + ttl,
          };
          return { ...state, ...cacheToUpdate };
        }

        const batchedParams = action.request.map(({ params }) => params);
        const { fulfilled, rejected } = unbatchResponse(batchedParams, action.response);

        rejected.forEach(({ params, error }) => {
          // FIXME: this seems so dangerous - all to avoid letting the user have access to
          // retry function in the `unbatchResponse` function
          const { retry } = action.request.find(reqInfo => reqInfo.params === params);
          if (!retry) throw new Error('Could not map params back to retry function');
          cacheToUpdate[createCacheKey(params)] = {
            status: 'rejected',
            retry: retry,
            error: error,
            expiration: Date.now() + ttl,
          };
        });

        fulfilled.forEach(({ params, result }) => {
          cacheToUpdate[createCacheKey(params)] = {
            result: result,
            status: 'fulfilled',
            expiration: Date.now() + ttl,
          };
        });

        return { ...state, ...cacheToUpdate };

      case RESOURCE_ERROR:
        paramsList = buildBatches ? action.request : [action.request];
        paramsList.forEach(({ params, retry }) => {
          cacheToUpdate[createCacheKey(params)] = {
            status: 'rejected',
            retry: retry,
            expiration: Date.now() + ttl,
            error: 'Fetch error', // bad default message????
          };
        });
        return { ...state, ...cacheToUpdate };
      default:
        return state;
    }
  };
}
