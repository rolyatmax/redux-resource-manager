import mapObject from './utils/map_object';
import type { ResourceConfig, ResourceConfigMap } from './resource_config';
import { createPending } from './resource';
import type { Resource } from './resource';
import { createResourceFetcher } from './fetch_resource';

type Store = { getState: () => {[key:string]:Object } }
type Selector = (params: Object) => Resource
type SelectorMap = {
    [resourceName:string]:Selector
}

export function createSelectorMap(
    resourceConfigs: ResourceConfigMap,
    store: Store
):SelectorMap {
  const fetchResource = createResourceFetcher(store);
  return mapObject(resourceConfigs, (config) => createSelector(config, fetchResource, store));
}

function createSelector(
    resourceConfig:ResourceConfig,
    fetchResource: (config:ResourceConfig, params:Object) => void,
    store: Store
):Selector {
  const { createCacheKey, resourceName } = resourceConfig;

  return (params) => {
    const state = store.getState()[resourceName];
    const key = createCacheKey(params);
    if (!state[key] || Date.now() > state[key].expiration) {
      fetchResource(resourceConfig, params);
    }
    return state[key] || createPending();
  };
}
