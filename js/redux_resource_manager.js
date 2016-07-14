import {combineReducers} from 'redux';
import {debounce} from 'underscore'; // TODO: implement this in utils
import {fetchJSON, mapObject, identity} from './lib/utils';


const RESOURCE_FETCH = 'RESOURCE_FETCH';
const RESOURCE_RECEIVED = 'RESOURCE_RECEIVED';
const RESOURCE_ERROR = 'RESOURCE_ERROR';

const userState = '__userState';
const resourceManagerState = '__resourceManagerState';

export default function applyResourceManager(resources) {
    const resourceConfigs = applyDefaults(resources);
    return (createStore) => (reducer, preloadedState, enhancer) => {
        const reducers = {
            [userState]: reducer,
            [resourceManagerState]: createResourceManagerReducer(resourceConfigs)
        };
        reducer = combineReducers(reducers);
        const store = createStore(reducer, preloadedState, enhancer);
        const get = mapObject(resourceConfigs, (config) => createResourceGetter(config, store));
        const wrappedStore = {
            ...store,
            get,
            getState: function wrappedGetState() {
                const state = store.getState();
                return {
                    ...state[userState],
                    [resourceManagerState]: state[resourceManagerState]
                };
            }
        };
        return wrappedStore;
    };
}

function createResourceManagerReducer(resourceConfigs) {
    return combineReducers(mapObject(resourceConfigs, (config) => {
        return createResourceReducer(config);
    }));
}

function createResourceGetter(resourceConfig, store) {
    const {createCacheKey, resourceName} = resourceConfig;
    const {getState, dispatch} = store;
    return (opts) => {
        const state = getState()[resourceManagerState][resourceName];
        const key = createCacheKey(opts);
        if (!state[key] || Date.now() > state[key].expiration) {
            fetchResource(resourceConfig, opts, dispatch);
        }

        return state[key] || {status: 'pending'};
    };
};

function applyDefaults(definitions) {
    return mapObject(definitions, (config, name) => ({
        ...config,
        resourceName: name,
        createCacheKey: config.createCacheKey || createDefaultCacheKey(config),
        parseResponse: config.parseResponse || identity
    }));
}

function createDefaultCacheKey(resourceConfig) {
    return function defaultCacheKey(opts) {
        const {url} = getUrlAndFetchOptions(resourceConfig, opts);
        return url;
    };
}

function getUrlAndFetchOptions(resourceConfig, opts) {
    const {buildUrl} = resourceConfig;
    let buildUrlResult = buildUrl(opts);
    if (typeof buildUrlResult === 'string') {
        return {
            url: buildUrlResult,
            fetchOptions: {}
        };
    }
    let {url, ...fetchOptions} = buildUrlResult;
    return {url, fetchOptions};
}

const fetchResource = (() => {
    let queue = {};
    const fetchInBatch = debounce((resourceConfig, dispatch) => {
        const {buildBatches, resourceName} = resourceConfig;
        let batches = buildBatches(queue[resourceName].slice());
        batches.forEach((batch) => {
            let {url, fetchOptions} = getUrlAndFetchOptions(resourceConfig, batch);
            let request = batch.map((opts) => {
                let retry = () => fetchResource(resourceConfig, opts, dispatch);
                return {opts, retry};
            });
            sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
        });
        queue[resourceName] = [];
    }, 50); // TODO: make this batching buffer configurable?

    return (resourceConfig, opts, dispatch) => {
        const {buildBatches, resourceName} = resourceConfig;
        if (buildBatches) {
            queue[resourceName] = queue[resourceName] || [];
            queue[resourceName].push(opts);
            fetchInBatch(resourceConfig, dispatch);
        } else {
            const retry = () => fetchResource(resourceConfig, opts, dispatch);
            let {url, fetchOptions} = getUrlAndFetchOptions(resourceConfig, opts);
            const request = {opts, retry};
            sendRequest(resourceConfig, url, fetchOptions, request, dispatch);
        }
    };
})();

function sendRequest(resourceConfig, url, fetchOptions, request, dispatch) {
    let {resourceName} = resourceConfig;
    function success(response) {
        dispatch(resourceReceived({resourceName, request, response}));
    }
    function fail() {
        dispatch(resourceError({resourceName, request}));
    }

    fetchJSON(url, fetchOptions).then(success, fail);
    dispatch(resourceFetch({resourceName, request}));
}

/////// actions

function resourceFetch({resourceName, request}) {
    const type = RESOURCE_FETCH;
    return {type, resourceName, request};
}

function resourceReceived({resourceName, request, response}) {
    const type = RESOURCE_RECEIVED;
    return {type, resourceName, request, response};
}

function resourceError({resourceName, request}) {
    const type = RESOURCE_ERROR;
    return {type, resourceName, request};
}

////////// createResourceReducer

function createResourceReducer(resourceConfig) {
    const {resourceName, ttl, createCacheKey, parseResponse, buildBatches} = resourceConfig;
    return function resourceReducer(state = {}, action) {
        if (action.resourceName !== resourceName) {
            return state;
        }

        let cacheToUpdate = {};
        let optsList;
        switch (action.type) {
        case RESOURCE_FETCH:
            optsList = buildBatches ? action.request : [action.request];
            optsList.forEach(({opts}) => {
                cacheToUpdate[createCacheKey(opts)] = {status: 'pending'};
            });
            return {...state, ...cacheToUpdate};
        case RESOURCE_RECEIVED:
            let joinedRequestResponse;
            if (buildBatches) {
                joinedRequestResponse = action.request.map(({opts, retry}) => ({
                    request: {opts, retry},
                    response: parseResponse(opts, action.response)
                }));
            } else {
                joinedRequestResponse = [{
                    request: action.request,
                    response: parseResponse(action.response)
                }];
            }
            joinedRequestResponse.forEach(({request, response}) => {
                cacheToUpdate[createCacheKey(request.opts)] = {
                    result: response,
                    status: 'fulfilled',
                    expiration: Date.now() + ttl
                };
            });
            return {...state, ...cacheToUpdate};
        case RESOURCE_ERROR:
            optsList = buildBatches ? action.request : [action.request];
            optsList.forEach(({opts, retry}) => {
                cacheToUpdate[createCacheKey(opts)] = {
                    status: 'rejected',
                    retry: retry
                };
            });
            return {...state, ...cacheToUpdate};
        default:
            return state;
        }
    };
}
