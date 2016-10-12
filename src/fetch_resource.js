/* @flow */
import debounce from './utils/debounce';
import getUrlAndFetchOptions from './get_url_and_fetch_options';
import fetchJSON from './utils/fetch_json';
import { RequestParams, ResourceMap, ResourceHandlers } from './types';

const queue = {};
const fetchInBatch = debounce((resourceConfig, handlers) => {
  const { buildBatches, resourceName } = resourceConfig;
  const batches = buildBatches(queue[resourceName].slice());
  batches.forEach((batch) => {
    const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, batch);
    const request = batch.map((params) => {
      const retry = () => fetchResource(resourceConfig, params, handlers);
      return { params, retry };
    });
    sendRequest(resourceConfig, url, fetchOptions, request, handlers);
  });
  queue[resourceName] = [];
}, 50); // TODO: make this batching buffer configurable?


function sendRequest(resourceConfig, url, fetchOptions, request, handlers) {
  const { resourceName } = resourceConfig;
  const startTime = getTimer();

  function success(response) {
    const duration = getDuration(startTime);
    handlers.onReceived({ resourceName, request, duration }, response);
  }

  function fail(error) {
    const duration = getDuration(startTime);
    // TODO: redux middleware should handle logging this error
    // console.error(`redux-resource-manager error from ${resourceName}:`, error);
    handlers.onError({ resourceName, request, duration }, error);
  }

  fetchJSON(url, fetchOptions).then(success, fail);
  handlers.onFetch({ resourceName, request });
}


export function fetchResource(
    resourceConfig: ResourceMap,
    params: RequestParams,
    handlers: ResourceHandlers):void {
  const { buildBatches, resourceName } = resourceConfig;
  if (buildBatches) {
    queue[resourceName] = queue[resourceName] || [];
    queue[resourceName].push(params);
    fetchInBatch(resourceConfig, handlers);
  } else {
    const retry = () => fetchResource(resourceConfig, params, handlers);
    const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, params);
    const request = { params, retry };
    sendRequest(resourceConfig, url, fetchOptions, request, handlers);
  }
}

function getTimer() {
  return Math.round(window.performance.now());
}

function getDuration(startTime) {
  return getTimer() - startTime;
}
