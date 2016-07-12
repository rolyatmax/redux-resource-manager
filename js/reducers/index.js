import {combineReducers} from 'redux';
import {addResourceReducers} from '../lib/redux_resource_helpers';

const getDefaultState = () => ({username: null});

function appState(state = getDefaultState(), action) {
    switch (action.type) {
    case 'SET_USER':
        return {...state, username: action.username};
    default:
        return state;
    }
}

let reducers = {appState};
reducers = addResourceReducers(reducers);
export default combineReducers(reducers);
