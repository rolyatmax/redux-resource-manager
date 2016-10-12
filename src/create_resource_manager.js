/* @flow */
import mapObject from './utils/map_object';
import identity from './utils/identity';
import { fetchResource } from './fetch_resource';
import getUrlAndFetchOptions from './get_url_and_fetch_options';
import { pending, ResourceMap, ResourceEventHandlers, ResourceManager } from './types';
import { createResourceStore } from './create_store';
import { buildManager } from './react_bindings';

const pendingState = { status: pending };

// TODO: allow passing in own store?
export function createResourceManager(
    baseConfig: ResourceMap,
    eventHandlers: ResourceEventHandlers
):ResourceManager {
  const resourceConfigs = applyDefaults(baseConfig);
  const store = createResourceStore(resourceConfigs, eventHandlers);

  const getResources = mapObject(
      resourceConfigs,
      (config) => createResourceGetter(config, store)
  );

  const manager = buildManager(getResources);

  return { manager };
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

function createResourceGetter(resourceConfig, store) {
  const { createCacheKey, resourceName } = resourceConfig;

  return (params) => {
    const state = store.getState()[resourceName];
    const key = createCacheKey(params);
    if (!state[key] || Date.now() > state[key].expiration) {
      fetchResource(resourceConfig, params, store.dispatch);
    }
    return state[key] || pendingState;
  };
}
