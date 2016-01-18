import {combineReducers} from 'redux';
import {users} from './users';


function appState(state = {username: null}, action) {
    switch (action.type) {
    case 'SET_USER':
        return {...state, username: action.username};
    default:
        return state;
    }
}

export default combineReducers({appState, users});
