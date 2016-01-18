import {actions, creators} from '../actions';

let {DATA_RECEIVED, ERROR, FETCH} = actions;

export function createCacheReducerFns(params) {
    let {
        reducerName,
        createCacheKey = () => '-',
        parseResponse = val => val,
        requiredFieldsForFetch = [],
        initialState = {}
    } = params;

    function reducer(state = initialState, action) {
        if (action.reducerName !== reducerName) {
            return state;
        }
        switch (action.type) {
        case FETCH:
            return {
                ...state,
                [createCacheKey(action.opts)]: {
                    status: 'pending'
                }
            };
        case DATA_RECEIVED:
            return {
                ...state,
                [createCacheKey(action.request.opts)]: {
                    status: 'fulfilled',
                    expiration: action.request.expiration,
                    result: parseResponse(action.response)
                }
            };
        case ERROR:
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

    function getData(state, opts) {
        return state[createCacheKey(opts)];
    }

    function shouldFetch(state, opts) {
        if (!requiredFieldsForFetch.every(field => opts[field])) {
            return false;
        }
        let data = getData(state, opts);
        return !data || Date.now() > data.expiration;
    }

    function getAndEnsureData(state, opts, dispatch) {
        if (shouldFetch(state, opts)) {
            // FIXME: dispatching here means this method isn't ideal for use
            // within the render cycle. Figure out a way to call this outside the render
            // perhaps on APP_STATE_CHANGE events
            dispatch(creators.fetch({reducerName, opts}));
        }
        return getData(state, opts) || {status: 'pending'};
    };

    return {reducer, getAndEnsureData};
}
