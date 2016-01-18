import {createStore, applyMiddleware} from 'redux';
import createLogger from 'redux-logger';
import rootReducer from './reducers';
import {createDataAccessMiddleware} from './middleware/data_access';
import {usersDataAccess} from './reducers/users';


export default applyMiddleware(
    createLogger(),
    createDataAccessMiddleware({users: usersDataAccess})
)(createStore)(rootReducer);
