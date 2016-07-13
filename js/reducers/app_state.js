const getDefaultState = () => ({usernames: []});

export default function appState(state = getDefaultState(), action) {
    switch (action.type) {
    case 'SET_USER':
        return {...state, usernames: action.usernames};
    default:
        return state;
    }
}
