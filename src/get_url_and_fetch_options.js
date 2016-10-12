/* @flow */
import { ResourceMap, ResourceParams, FetchOptions } from './types';

function getUrlAndFetchOptions(
    resourceConfig: ResourceMap,
    params: ResourceParams
):{ url: string, fetchOptions: FetchOptions } {
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

export default getUrlAndFetchOptions;
