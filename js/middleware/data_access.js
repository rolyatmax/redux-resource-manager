import {makeFetch, dataReceived, error} from '../actions';


function fetchJSON(url) {
    return fetch(url).then(response => {
        if (response.status < 200 || response.status >= 400) {
            throw new Error(`${response.status} response from ${url}`);
        }
        return response.json();
    });
}

// This middleware creator takes a dictionary that maps store --> dataAccessConfig
// A dataAccessConfig object looks like this:
// {
//     buildURL: <function which takes props and returns a URL to use for fetching data>,
//     ttl: <time in milliseconds to consider a given piece of cached data valid>
// }

export const createDataAccessMiddleware = dataAccessConfigs => store => next => action => {
    let {dispatch} = store;

    switch (action.type) {
    case 'FETCH':
        let {reducerName, props} = action;
        let {buildURL, ttl} = dataAccessConfigs[reducerName];
        let request = {
            expiration: Date.now() + ttl,
            props: {...props},
            retry: () => dispatch(makeFetch({reducerName, props}))
        };
        fetchJSON(buildURL(props)).then(
            response => dispatch(dataReceived({reducerName, response, request})),
            () => dispatch(error({reducerName, request}))
        );
        break;
    default:
        break;
    }

    return next(action);
};
