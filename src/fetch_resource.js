/* @flow */
import debounce from './utils/debounce';
import { getUrlAndFetchOptions } from './url_options';
import fetchJSON from './utils/fetch_json';
import { resourceFetch, resourceReceived, resourceError } from './action';
import type { Action } from './action'; // eslint-disable-line no-duplicate-imports
import type { ResourceConfig } from './resource_config';

const queue = {};
const fetchInBatch = debounce((resourceConfig, dispatch) => {
  const { buildBatches, resourceName } = resourceConfig;
  const batches = buildBatches(queue[resourceName].slice());
  batches.forEach((batch) => {
    const request = batch.map((params) => {
      const retry = () => fetchResource(resourceConfig, params, dispatch);
      return { params, retry };
    });

    sendRequest(resourceConfig, batch, request, dispatch);
  });
  queue[resourceName] = [];
}, 50); // TODO: make this batching buffer configurable?


function sendRequest(resourceConfig, params, request, dispatch):void {
  const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, params);
  const { resourceName } = resourceConfig;
  const startTime = getTimer();
  const requestParams = { resourceName, request };

  function success(response) {
    const duration = getDuration(startTime);
    dispatch(resourceReceived(requestParams, duration, response));
  }

  function fail(error) {
    const duration = getDuration(startTime);
    console.error(`redux-resource-manager error from ${resourceName}:`, error);

    dispatch(resourceError(requestParams, duration, error));
  }

  fetchJSON(url, fetchOptions).then(success, fail);
  dispatch(resourceFetch(requestParams));
}

export function fetchResource(
    resourceConfig: ResourceConfig,
    params: Object,
    dispatch: (action: Action) => void
):void {
  const { buildBatches, resourceName } = resourceConfig;
  if (buildBatches) {
    queue[resourceName] = queue[resourceName] || [];
    queue[resourceName].push(params);
    fetchInBatch(resourceConfig, dispatch);
  } else {
    const request = {
      params,
      retry: () => fetchResource(resourceConfig, params, dispatch),
    };
    sendRequest(resourceConfig, params, request, dispatch);
  }
}

function getTimer() {
  return Math.round(window.performance.now());
}

function getDuration(startTime) {
  return getTimer() - startTime;
}
