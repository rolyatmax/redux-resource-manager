/* @flow */
import { createStore, combineReducers } from 'redux';
import mapObject from './utils/map_object';
import {
    RESOURCE_FETCH, RESOURCE_RECEIVED, RESOURCE_ERROR, pending, fulfilled, rejected,
    ResourceMap, ResourceConfig, ResourceState, ResourceManagerState, Action, Store,
    ResourceEventHandlers,
} from './types';

export function createResourceStore(
    resourceConfigs: ResourceMap,
    handlers: ResourceEventHandlers):Store {
  const reducer = createResourceManagerReducer(resourceConfigs);

  return createStore(reducer, middleware(handlers));
}

export function createResourceManagerReducer(resourceConfigs: ResourceMap):ResourceManagerState {
  return combineReducers(mapObject(resourceConfigs, createResourceReducer));
}

export const createResourceReducer = (config: ResourceConfig) =>
    (state: ResourceState = {}, action: Action): ResourceState => {
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
  const cacheToUpdate = update(action.request, config, createPending);
  return { ...state, ...cacheToUpdate };
}

function handleReceived(state, action, config) {
  const { ttl, createCacheKey, parseResponse, buildBatches, unbatchResponse } = config;
  if (!buildBatches) {
    const key = createCacheKey(action.request.params);
    const nextState = createFulfilled(parseResponse(action.response), ttl);
    return { ...state, [key]: nextState };
  }

  const batchedParams = action.request.map(({ params }) => params);
  const res = unbatchResponse(batchedParams, action.response);

  const rejectedUpdate = updateParams(res.rejected, ({ params, error }) => {
    // FIXME: this seems so dangerous - all to avoid letting the user have access to
    // retry function in the `unbatchResponse` function
    const { retry } = action.request.find(reqInfo => reqInfo.params === params);
    if (!retry) throw new Error('Could not map params back to retry function');

    return [createCacheKey(params), createRejected(error, ttl, retry)];
  });


  const fulfilledUpdate = updateParams(res.fulfilled, ({ params, result }) => [
    createCacheKey(params),
    createFulfilled(result, ttl),
  ]);

  return { ...state, ...rejectedUpdate, ...fulfilledUpdate };
}


function handleError(state, action, config) {
  const cacheToUpdate = update(action.request, config, ({ retry }) =>
    createRejected(action.error, config.ttl, retry));

  return { ...state, ...cacheToUpdate };
}

function update(request, config, fn) {
  const paramsList = config.buildBatches ? request : [request];

  return updateParams(paramsList, (data) => [
    config.createCacheKey(data.params),
    fn(data),
  ]);
}


function createPending() {
  return { status: pending };
}

function createFulfilled(result, ttl) {
  return {
    result: result,
    status: fulfilled,
    expiration: Date.now() + ttl,
  };
}

function createRejected(error, ttl, retry) {
  return {
    status: rejected,
    retry,
    expiration: Date.now() + ttl,
    error,
  };
}

function updateParams(paramsList, fn) {
  return paramsList.map(fn).reduce((coll, [key, value]) => {
    coll[key] = value;
    return coll;
  }, {});
}

function middleware(handlers: ResourceEventHandlers) {
  const actionHandlers = {
    [RESOURCE_FETCH]: handlers.onFetch,
    [RESOURCE_RECEIVED]: handlers.onReceived,
    [RESOURCE_ERROR]: handlers.onError,
  };

  return () => (next) => (action) => {
    const handler = actionHandlers[action.type];
    if (handler) { handler(action.payload); }
    return next(action);
  };
}
