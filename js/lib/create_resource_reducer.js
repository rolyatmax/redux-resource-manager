export default function createResourceReducer(resourceConfig) {
    const {resourceName, ttl, createCacheKey, parseResponse} = resourceConfig;
    return function resourceReducer(state = {}, action) {
        if (action.resourceName !== resourceName) {
            return state;
        }

        switch (action.type) {
        case 'FETCH':
            return {
                ...state,
                [createCacheKey(action.request.opts)]: {status: 'pending'}
            };
        case 'DATA_RECEIVED':
            return {
                ...state,
                [createCacheKey(action.request.opts)]: {
                    result: parseResponse(action.response),
                    status: 'fulfilled',
                    expiration: Date.now() + ttl
                }
            };
        case 'ERROR':
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
