/* @flow */
import debounce from './utils/debounce';
import { getUrlAndFetchOptions } from './url_options';
import fetchJSON from './utils/fetch_json';
import { resourceFetch, resourceReceived, resourceError } from './action';
import type { Action } from './action';
import type { ResourceConfig } from './resource_config';

export function createResourceFetcher(
    store:{dispatch: (action:Action) => void },
    fetcherParams:{buffer?: number} = {}
) {
  const {
      buffer = 50,
  } = fetcherParams;
  const { dispatch } = store;
  const queue = {};

  const fetchInBatch = debounce((resourceConfig, buildBatches) => {
    const { resourceName } = resourceConfig;

    const batches = buildBatches(queue[resourceName].slice());
    batches.forEach((batch) => {
      const request = batch.map((params) => {
        const retry = () => fetchResource(resourceConfig, params);
        return { params, retry };
      });

      sendRequest(resourceConfig, batch, request);
    });
    queue[resourceName] = [];
  }, buffer);


  function sendRequest(resourceConfig, params, request) {
    const { resourceName } = resourceConfig;
    const { url, fetchOptions } = getUrlAndFetchOptions(resourceConfig, params);
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

  function fetchResource(resourceConfig:ResourceConfig, params: Object):void {
    const { buildBatches, resourceName } = resourceConfig;
    if (buildBatches) {
      queue[resourceName] = queue[resourceName] || [];
      queue[resourceName].push(params);
      fetchInBatch(resourceConfig, buildBatches);
    } else {
      const request = {
        params,
        retry: () => fetchResource(resourceConfig, params),
      };
      sendRequest(resourceConfig, params, request);
    }
  }

  return fetchResource;
}


function getTimer() {
  return Math.round(window.performance.now());
}

function getDuration(startTime) {
  return getTimer() - startTime;
}
