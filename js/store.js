import {createStore, applyMiddleware, combineReducers} from 'redux';
import createLogger from 'redux-logger';
import applyResourceManager from './lib/redux_resource_helpers';
import appState from './reducers/app_state';
import resources from './resources';

let wrappedCreateStore = createStore;
wrappedCreateStore = applyMiddleware(createLogger())(wrappedCreateStore);
wrappedCreateStore = applyResourceManager(resources)(wrappedCreateStore);

const rootReducer = combineReducers({appState});
export default wrappedCreateStore(rootReducer);
