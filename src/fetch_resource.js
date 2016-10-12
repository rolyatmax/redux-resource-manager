/* @flow */
import debounce from './utils/debounce';
import getUrlAndFetchOptions from './get_url_and_fetch_options';
import fetchJSON from './utils/fetch_json';
import { actions, RequestParams, ResourceMap } from './types';

const queue = {};
const fetchInBatch = debounce((resourceConfig, dispatch) => {
  const { buildBatches, resourceName } = resourceConfig;
  const batches = buildBatches(queue[resourceName].slice());
  batches.forEach((batch) => {
    const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, batch);
    const request = batch.map((params) => {
      const retry = () => fetchResource(resourceConfig, params, dispatch);
      return { params, retry };
    });
    sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
  });
  queue[resourceName] = [];
}, 50); // TODO: make this batching buffer configurable?


function sendRequest(resourceConfig, url, fetchOptions, request, dispatch) {
  const { resourceName } = resourceConfig;
  const startTime = getTimer();

  function success(response) {
    const duration = getDuration(startTime);
    dispatch(actions.resourceReceived({ resourceName, request, response, duration }));
  }

  function fail(error) {
    const duration = getDuration(startTime);
    console.error(`redux-resource-manager error from ${resourceName}:`, error);
    dispatch(actions.resourceError({ resourceName, request, error, duration }));
  }

  fetchJSON(url, fetchOptions).then(success, fail);
  dispatch(actions.resourceFetch({ resourceName, request }));
}

export function fetchResource(
    resourceConfig: ResourceMap,
    params: RequestParams,
    dispatch: (action:any) => void):void {
  const { buildBatches, resourceName } = resourceConfig;
  if (buildBatches) {
    queue[resourceName] = queue[resourceName] || [];
    queue[resourceName].push(params);
    fetchInBatch(resourceConfig, dispatch);
  } else {
    const retry = () => fetchResource(resourceConfig, params, dispatch);
    const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, params);
    const request = { params, retry };
    sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
  }
}

function getTimer() {
  return Math.round(window.performance.now());
}

function getDuration(startTime) {
  return getTimer() - startTime;
}
