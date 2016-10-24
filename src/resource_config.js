/* @flow */
import mapObject from './utils/map_object';
import identity from './utils/identity';
import { getUrlAndFetchOptions } from './url_options';
import type { URLOptions } from './url_options'; // eslint-disable-line no-duplicate-imports

type BaseResourceConfig = {
    buildUrl: (params: Object) => string | URLOptions,
    buildBatches?: (items: [any]) => [any],
    ttl: number,
    createCacheKey: (params: Object) => string,
    parseResponse: (response: any) => any,
    unbatchResponse: (responses: any) => any,
}

export type ResourceConfig = BaseResourceConfig & {
    resourceName: string
}

export type BaseResourceConfigMap = {[resourceName: string]: BaseResourceConfig }
export type ResourceConfigMap = {[resourceName: string]: ResourceConfig }

export function applyDefaults(
    definitions: BaseResourceConfigMap
):ResourceConfigMap {
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
