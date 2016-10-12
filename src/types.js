export type RequestParams = {}
export type ResourceResponse = {}
export type ResourceState = {[cacheKey: string]: Resource}
export type ResourceManagerState = {[key: string]: ResourceState }

export type ResourceEventHandlers = {
    onFetch?: (params: RequestParams) => void,
    onReceived?: (params: RequestParams, data: any) => void,
    onError?: (params: RequestParams, error: Error) => void,
}

export type BaseResource = {
    buildUrl: any,
    buildBatches: any,
    ttl: number,
    createCacheKey: any,
    parseResponse: any,
    unbatchResponse: any,
}

export type ResourceConfig = BaseResource

export type ResourceMap = {[resourceName: string]: BaseResource }
export type ResourceGetter = (request: RequestParams) => ResourceResponse
export type ResourceManager = {[resourceName: string]: ResourceGetter}

export type FetchOptions = {}

export const RESOURCE_FETCH = 'redux-resource-manager/RESOURCE_FETCH';
export const RESOURCE_RECEIVED = 'redux-resource-manager/RESOURCE_RECEIVED';
export const RESOURCE_ERROR = 'redux-resource-manager/RESOURCE_ERROR';

export const actions = {
  resourceFetch({ resourceName, request }) {
    const type = RESOURCE_FETCH;
    return { type, resourceName, request };
  },
  resourceReceived({ resourceName, request, duration }, response) {
    const type = RESOURCE_RECEIVED;
    return { type, resourceName, request, response, duration };
  },
  resourceError({ resourceName, request, duration }, error, retry) {
    const type = RESOURCE_ERROR;
    return { type, resourceName, request, error, duration, retry };
  },
};

export type FetchAction = { type: RESOURCE_FETCH, params: RequestParams }
export type ReceivedAction = { type: RESOURCE_RECEIVED, params: RequestParams, data: any }
export type ErrorAction = { type: RESOURCE_ERROR, params: RequestParams, error: Error }
export type Action = FetchAction | ReceivedAction | ErrorAction

export const pending = 'pending';
export const fulfilled = 'fulfilled';
export const rejected = 'rejected';

export type PendingResource = { status: pending }
export type FulfilledResource = {
    status: fulfilled,
    result: any,
    expiration: number
}
export type RejectedResource = {
    status: rejected,
    retry: () => void,
    error: Error,
    expiration: number,
}
export type Resource = PendingResource | FulfilledResource | RejectedResource

export type Store = {
    getState: () => Object,
    dispatch: (action: any) => void
}
