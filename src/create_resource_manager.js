/* @flow */
import mapObject from './utils/map_object';
import identity from './utils/identity';
import { fetchResource } from './fetch_resource';
import getUrlAndFetchOptions from './get_url_and_fetch_options';

import { pending, ResourceMap, ResourceHandlers, ResourceManager } from './types';

const pendingState = { status: pending };

export function createResourceManager(
    baseConfig: ResourceMap,
    eventHandlers: ResourceHandlers):ResourceManager {
  const resourceConfigs = applyDefaults(baseConfig);

  const getResources = mapObject(
    resourceConfigs,
    (config) => createResourceGetter(config, eventHandlers)
  );

  return getResources;
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

function createResourceGetter(resourceConfig, handlers) {
  const { createCacheKey, resourceName } = resourceConfig;

  return (params) => {
    const state = handlers.getState(resourceName);
    const key = createCacheKey(params);
    if (!state[key] || Date.now() > state[key].expiration) {
      fetchResource(resourceConfig, params, handlers);
    }
    return state[key] || pendingState;
  };
}
