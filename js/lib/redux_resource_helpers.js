import {combineReducers} from 'redux';
import {fetchJSON, mapObject, identity} from './utils';


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
        createCacheKey: config.createCacheKey || config.buildUrl,
        parseResponse: config.parseResponse || identity
    }));
}

function fetchResource(resourceConfig, opts, dispatch) {
    opts = {...opts};
    const {buildUrl, resourceName} = resourceConfig;
    const retry = () => fetchResource(resourceConfig, opts, dispatch);
    const request = {opts, retry};

    function success(response) {
        dispatch(dataReceived({resourceName, request, response}));
    }
    function fail() {
        dispatch(error({resourceName, request}));
    }

    fetchJSON(buildUrl(opts)).then(success, fail);
    dispatch(fetch({resourceName, request}));
};

/////// actions

function fetch({resourceName, request}) {
    const type = RESOURCE_FETCH;
    return {type, resourceName, request};
}

function dataReceived({resourceName, request, response}) {
    const type = RESOURCE_RECEIVED;
    return {type, resourceName, request, response};
}

function error({resourceName, request}) {
    const type = RESOURCE_ERROR;
    return {type, resourceName, request};
}

////////// createResourceReducer

function createResourceReducer(resourceConfig) {
    const {resourceName, ttl, createCacheKey, parseResponse} = resourceConfig;
    return function resourceReducer(state = {}, action) {
        if (action.resourceName !== resourceName) {
            return state;
        }

        switch (action.type) {
        case RESOURCE_FETCH:
            return {
                ...state,
                [createCacheKey(action.request.opts)]: {status: 'pending'}
            };
        case RESOURCE_RECEIVED:
            return {
                ...state,
                [createCacheKey(action.request.opts)]: {
                    result: parseResponse(action.response),
                    status: 'fulfilled',
                    expiration: Date.now() + ttl
                }
            };
        case RESOURCE_ERROR:
            return {
                ...state,
                [createCacheKey(action.request.opts)]: {
                    status: 'rejected',
                    retry: action.request.retry
                }
            };
        default:
            return state;
        }
    };
}
