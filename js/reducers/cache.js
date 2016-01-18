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
        case 'FETCH':
            return {
                ...state,
                [createCacheKey(action.props)]: {
                    status: 'pending'
                }
            };
        case 'DATA_RECEIVED':
            return {
                ...state,
                [createCacheKey(action.request.props)]: {
                    status: 'fulfilled',
                    expiration: action.request.expiration,
                    result: parseResponse(action.response)
                }
            };
        case 'ERROR':
            return {
                ...state,
                [createCacheKey(action.request.props)]: {
                    status: 'rejected',
                    retry: action.request.retry
                }
            };
        default:
            return state;
        }
    };

    function getData(state, props) {
        return state[createCacheKey(props)];
    }

    function shouldFetch(state, props) {
        if (!requiredFieldsForFetch.every(field => props[field])) {
            return false;
        }
        let data = getData(state, props);
        return !data || Date.now() > data.expiration;
    }

    function getAndEnsureData(state, props, fetch) {
        if (shouldFetch(state, props)) {
            // FIXME: dispatching here means this method isn't ideal for use
            // within the render cycle. Figure out a way to call this outside the render
            // perhaps on APP_STATE_CHANGE events
            fetch({reducerName, props});
        }
        return getData(state, props) || {status: 'pending'};
    };

    return {reducer, getAndEnsureData};
}
