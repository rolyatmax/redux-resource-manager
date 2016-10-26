/* @flow */
export const RESOURCE_FETCH = 'redux-resource-manager/RESOURCE_FETCH';
export const RESOURCE_RECEIVED = 'redux-resource-manager/RESOURCE_RECEIVED';
export const RESOURCE_ERROR = 'redux-resource-manager/RESOURCE_ERROR';

export type Request = any

type FetchAction = {
    type: 'redux-resource-manager/RESOURCE_FETCH',
    resourceName: string,
    request: Request,
}
type ReceivedAction = {
    type: 'redux-resource-manager/RESOURCE_RECEIVED',
    resourceName: string,
    request: Request,
    response: any,
    duration: number,
}
type ErrorAction = {
    type: 'redux-resource-manager/RESOURCE_ERROR',
    resourceName: string,
    request: Request,
    error: Error,
    duration: number,
}
export type Action = FetchAction | ReceivedAction | ErrorAction

type RequestParams = { resourceName: string, request: Request }

export function resourceFetch(
    { resourceName, request }:RequestParams
):FetchAction {
    return { type: RESOURCE_FETCH, resourceName, request };
}

export function resourceReceived(
    { resourceName, request }:RequestParams,
    duration: number,
    response: any
):ReceivedAction {
    return { type: RESOURCE_RECEIVED, resourceName, request, response, duration };
}

export function resourceError(
    { resourceName, request }:RequestParams,
    duration: number,
    error: Error
):ErrorAction {
    return { type: RESOURCE_ERROR, resourceName, request, error, duration };
}
