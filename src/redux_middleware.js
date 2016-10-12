/* @flow */
import { createResourceManager } from './create_resource_manager';
import {
    ResourceMap, ResourceManagerState, ResourceManager,
    RESOURCE_FETCH, RESOURCE_RECEIVED, RESOURCE_ERROR,
} from './types';

type AppState = Object

type ReduxStore = {
    getState: () => AppState,
    dispatch: (action: any) => void,
}

const actions = {
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

export function createReduxResourceManager(
    resources: ResourceMap,
    getReducer: (state: AppState) => ResourceManagerState,
    store: ReduxStore,
):ResourceManager {
  const { dispatch, getState } = store;
  return createResourceManager(resources, {
    onFetch: (params) => dispatch(actions.resourceFetch(params)),
    onReceived: (params, data) => dispatch(actions.resourceReceived(params, data)),
    onError: (params, error, retry) => dispatch(actions.resourceError(params, error, retry)),
    getState: (key) => getReducer(getState())[key],
  });
}
