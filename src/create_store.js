/* @flow */
import { createStore as createReduxStore } from 'redux';
import { createReducer } from './create_reducer';
import { createMiddleware } from './external_handlers';
import type { ResourceEventHandlers } from './external_handlers';
import type { ResourceConfigMap } from './resource_config';

type Store = {
    getState: () => Object,
    dispatch: (action: any) => void
}

export function createStore(
    resourceConfigs: ResourceConfigMap,
    handlers: ResourceEventHandlers):Store {
  const reducer = createReducer(resourceConfigs);
  const middleware = createMiddleware(handlers);

  return createReduxStore(reducer, middleware);
}
