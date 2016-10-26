/* @flow */
import mapObject from './utils/map_object';
import type { ResourceConfig, ResourceConfigMap } from './resource_config';
import { createPending } from './resource';
import type { Resource } from './resource';
import { createResourceFetcher } from './fetch_resource';
import type { Action } from './action';

type Store = {
    dispatch: (action: Action) => void,
    getState: () => {[key:string]:Object }
}

type Selector = (params: Object) => Resource

export type SelectorMap = {
    [resourceName:string]:Selector
}

export function createSelectorMap(
    resourceConfigs: ResourceConfigMap,
    store: Store
):SelectorMap {
    return mapObject(resourceConfigs, (config) => createSelector(config, store));
}

function createSelector(
    resourceConfig:ResourceConfig,
    store: Store
):Selector {
    const { createCacheKey, resourceName } = resourceConfig;
    const fetchResource = createResourceFetcher(resourceConfig, store);

    return (params) => {
        const state = store.getState()[resourceName];
        const key = createCacheKey(params);
        if (!state[key] || Date.now() > state[key].expiration) {
            fetchResource(params);
        }
        return state[key] || createPending();
    };
}
