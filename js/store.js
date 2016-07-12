import {createStore, applyMiddleware, combineReducers} from 'redux';
import createLogger from 'redux-logger';
import applyResourceManager from './lib/redux_resource_helpers';
import appState from './reducers/app_state';
import resources from './resources';

const rootReducer = combineReducers({appState});
const createResourceManagerStore = applyResourceManager(resources)(createStore);
const createStoreWithMiddleware = applyMiddleware(createLogger())(createResourceManagerStore);

export default createStoreWithMiddleware(rootReducer);
