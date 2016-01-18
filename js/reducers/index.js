import {combineReducers} from 'redux';

function appState(state = {user: null}, action) {
    return state;
}

function users() {

}

const rootReducer = combineReducers({appState, users});

export default rootReducer;
