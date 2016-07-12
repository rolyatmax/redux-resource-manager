const getDefaultState = () => ({username: null});

export default function appState(state = getDefaultState(), action) {
    switch (action.type) {
    case 'SET_USER':
        return {...state, username: action.username};
    default:
        return state;
    }
}
