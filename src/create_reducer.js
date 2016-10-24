/* @flow */
import { combineReducers } from 'redux';
import mapObject from './utils/map_object';
import { createPending, createFulfilled, createRejected } from './resource';
import type { Resource } from './resource'; // eslint-disable-line no-duplicate-imports
import { RESOURCE_FETCH, RESOURCE_RECEIVED, RESOURCE_ERROR } from './action';
import type { Action } from './action'; // eslint-disable-line no-duplicate-imports
import type { ResourceConfig, ResourceConfigMap } from './resource_config';

type ResourceState = {[cacheKey: string]: Resource}
type ResourceManagerState = {[key: string]: ResourceState }
type SubReducer = (
    state: ResourceState,
    action:Action, config:ResourceConfig
) => ResourceState

export function createReducer(
    resourceConfigs: ResourceConfigMap
):ResourceManagerState {
  return combineReducers(mapObject(resourceConfigs, createResourceReducer));
}

const handlers: {[actionType: string]: SubReducer } = {
  [RESOURCE_FETCH]: handleFetch,
  [RESOURCE_RECEIVED]: handleReceived,
  [RESOURCE_ERROR]: handleError,
};

const createResourceReducer = (config: ResourceConfig) =>
    (state: ResourceState = {}, action: Action): ResourceState => {
      if (action.resourceName !== config.resourceName) {
        return state;
      }

      const handler = handlers[action.type];
      if (handler) {
        return handler(state, action, config);
      }
      return state;
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


function update(request, config, fn):ResourceState {
  const paramsList = config.buildBatches ? request : [request];

  return updateParams(paramsList, (data) => [
    config.createCacheKey(data.params),
    fn(data),
  ]);
}

function updateParams(paramsList, fn):ResourceState {
  return paramsList.reduce((coll, param) => {
    const [key, value] = fn(param);
    coll[key] = value;
    return coll;
  }, {});
}
