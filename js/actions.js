export function setUser(username) {
    const type = 'SET_USER';
    return {type, username};
}

export function makeFetch({reducerName, props}) {
    const type = 'FETCH';
    return {type, reducerName, props};
}

export function dataReceived({reducerName, request, response}) {
    const type = 'DATA_RECEIVED';
    return {type, reducerName, request, response};
}

export function error({reducerName, request}) {
    const type = 'ERROR';
    return {type, reducerName, request};
}
