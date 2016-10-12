
import mapObject from './utils/map_object';
import { RESOURCE_FETCH, RESOURCE_RECEIVED, RESOURCE_ERROR } from './types';

// TODO: peerDep redux
function combineReducers() {
  throw new Error('not implemented');
}

export function createResourceManagerReducer(resourceConfigs) {
  return combineReducers(mapObject(resourceConfigs, createResourceReducer));
}

export const createResourceReducer = (config) => (state = {}, action) => {
  if (action.resourceName !== config.resourceName) {
    return state;
  }

  switch (action.type) {
    case RESOURCE_FETCH:
      return handleFetch(state, action, config);
    case RESOURCE_RECEIVED:
      return handleReceived(state, action, config);
    case RESOURCE_ERROR:
      return handleError(state, action, config);
    default:
      return state;
  }
};


function handleFetch(state, action, config) {
  const paramsList = config.buildBatches ? action.request : [action.request];
  const cacheToUpdate = {};
  paramsList.forEach(({ params }) => {
    cacheToUpdate[config.createCacheKey(params)] = { status: 'pending' };
  });
  return { ...state, ...cacheToUpdate };
}

function handleReceived(state, action, config) {
  const { ttl, createCacheKey, parseResponse, buildBatches, unbatchResponse } = config;
  const cacheToUpdate = {};
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
}


function handleError(state, action, config) {
  const cacheToUpdate = {};
  const paramsList = config.buildBatches ? action.request : [action.request];
  paramsList.forEach(({ params, retry }) => {
    cacheToUpdate[config.createCacheKey(params)] = {
      status: 'rejected',
      retry: retry,
      expiration: Date.now() + config.ttl,
      error: action.error,
    };
  });
  return { ...state, ...cacheToUpdate };
}
