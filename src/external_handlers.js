/* @flow */
import { RESOURCE_FETCH, RESOURCE_RECEIVED, RESOURCE_ERROR } from './action';
import type { Request, Action } from './action';
export type ResourceEventHandlers = {
    onFetch?: (request: Request) => void,
    onReceived?: (request: Request, response: any) => void,
    onError?: (request: Request, error: Error) => void,
}

// TODO: correct type for middleware
export function createMiddleware(handlers: ResourceEventHandlers) {
    return () => (next: any) => (action: Action) => {
        if (action.type === RESOURCE_FETCH && handlers.onFetch) {
            handlers.onFetch(action.request);
        } else if (action.type === RESOURCE_RECEIVED && handlers.onReceived) {
            handlers.onReceived(action.request, action.response);
        } else if (action.type === RESOURCE_ERROR && handlers.onError) {
            handlers.onError(action.request, action.error);
        }
        return next(action);
    };
}
