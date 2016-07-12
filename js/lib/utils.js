export function fetchJSON(url, options = {}) {
    let requestOptions = {
        credentials: 'same-origin',
        ...options
    };

    return fetch(url, requestOptions).then(response => {
        if (response.status < 200 || response.status >= 400) {
            throw new Error(`${response.status} response from ${url}`);
        }
        return response.json();
    });
}

export function mapObject(obj, mapFn, target) {
    target = target || {};
    for (let key in obj) {
        target[key] = mapFn(obj[key], key);
    }
    return target;
};

export const identity = (val) => val;
