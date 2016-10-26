/* @flow */
import debounce from './utils/debounce';
import { getUrlAndFetchOptions } from './url_options';
import fetchJSON from './utils/fetch_json';
import { resourceFetch, resourceReceived, resourceError } from './action';
import type { Action } from './action';
import type { ResourceConfig } from './resource_config';

export function createResourceFetcher(
    resourceConfig: ResourceConfig,
    store:{dispatch: (action:Action) => void }
):(params: Object) => void {
    const {
        resourceName,
        batchBuffer = 50,
    } = resourceConfig;

    const { dispatch } = store;
    const queue = {};

    const fetchInBatch = debounce((buildBatches) => {
        const batches = buildBatches(queue[resourceName].slice());
        batches.forEach((batch) => {
            const request = batch.map((params) => {
                const retry = () => fetchResource(params);
                return { params, retry };
            });

            sendRequest(batch, request);
        });
        queue[resourceName] = [];
    }, batchBuffer);


    function sendRequest(params, request) {
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

    function fetchResource(params: Object):void {
        const { buildBatches } = resourceConfig;
        if (buildBatches) {
            queue[resourceName] = queue[resourceName] || [];
            queue[resourceName].push(params);
            fetchInBatch(buildBatches);
        } else {
            const request = {
                params,
                retry: () => fetchResource(params),
            };
            sendRequest(params, request);
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
