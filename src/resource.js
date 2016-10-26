/* @flow */
export const pending = 'pending';
export const fulfilled = 'fulfilled';
export const rejected = 'rejected';

type PendingResource = { status: 'pending' }
type FulfilledResource = {
    status: 'fulfilled',
    result: any,
    expiration: number
}
type RejectedResource = {
    status: 'rejected',
    retry: () => void,
    error: Error,
    expiration: number,
}
export type Resource = PendingResource | FulfilledResource | RejectedResource

export function createPending():PendingResource {
    return { status: pending };
}

export function createFulfilled(result:any, ttl:number):FulfilledResource {
    return {
        result: result,
        status: fulfilled,
        expiration: Date.now() + ttl,
    };
}

export function createRejected(error: Error, ttl: number, retry: () => void):RejectedResource {
    return {
        status: rejected,
        retry,
        expiration: Date.now() + ttl,
        error,
    };
}
