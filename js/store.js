import {createStore, applyMiddleware} from 'redux';
import createLogger from 'redux-logger';
import rootReducer from './reducers';

const store = applyMiddleware(createLogger())(createStore)(rootReducer);

export default store;
