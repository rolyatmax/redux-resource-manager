import mapObject from './utils/map_object';
import type { ResourceConfig, ResourceConfigMap } from './resource_config';
import { createPending } from './resource';
import type { Resource } from './resource'; // eslint-disable-line no-duplicate-imports
import { fetchResource } from './fetch_resource';

type Store = { getState: () => {[key:string]:Object } }
type Selector = (params: Object) => Resource
type SelectorMap = {
    [resourceName:string]:Selector
}

export function createSelectorMap(
    resourceConfigs: ResourceConfigMap,
    store: Store
):SelectorMap {
  return mapObject(resourceConfigs, (config) => createSelector(config, store));
}

function createSelector(resourceConfig:ResourceConfig, store: Store):Selector {
  const { createCacheKey, resourceName } = resourceConfig;

  return (params) => {
    const state = store.getState()[resourceName];
    const key = createCacheKey(params);
    if (!state[key] || Date.now() > state[key].expiration) {
      fetchResource(resourceConfig, params, store.dispatch);
    }
    return state[key] || createPending();
  };
}
