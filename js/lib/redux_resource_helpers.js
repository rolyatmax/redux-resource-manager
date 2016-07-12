import {fetchJSON, mapObject, identity} from './utils';
import resources from '../resources';
import createResourceReducer from './create_resource_reducer';


const resourceConfigs = applyDefaults(resources);

function applyDefaults(definitions) {
    return mapObject(definitions, (config, name) => ({
        ...config,
        resourceName: name,
        createCacheKey: config.createCacheKey || config.buildUrl,
        parseResponse: config.parseResponse || identity
    }));
}

function createResourceGetter(resourceConfig, store) {
    const {createCacheKey, resourceName} = resourceConfig;
    const {getState, dispatch} = store;
    return (opts) => {
        const state = getState()[resourceName];
        const key = createCacheKey(opts);
        if (!state[key] || Date.now() > state[key].expiration) {
            fetchResource(resourceConfig, opts, dispatch);
        }

        return state[key] || {status: 'pending'};
    };
};

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

//////// exports

export function bindResourceToStore(store) {
    return mapObject(resourceConfigs, (config) => createResourceGetter(config, store));
}

export function addResourceReducers(reducers) {
    return mapObject(resourceConfigs, (config, name) => {
        if (reducers[name]) {
            throw new Error(`Reducer "${name}" already exists!`);
        }
        return createResourceReducer(config);
    }, {...reducers});
}

/////// actions

function fetch({resourceName, request}) {
    const type = 'FETCH';
    return {type, resourceName, request};
}

function dataReceived({resourceName, request, response}) {
    const type = 'DATA_RECEIVED';
    return {type, resourceName, request, response};
}

function error({resourceName, request}) {
    const type = 'ERROR';
    return {type, resourceName, request};
}
