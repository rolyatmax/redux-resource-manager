/* @flow */

class FetchError extends Error {
  statusCode: number;
  constructor(msg, statusCode) {
    super(msg);
    this.statusCode = statusCode;
  }
}

export default function fetchJSON(url: string, options: Object = {}) {
  const requestOptions = {
    credentials: 'same-origin',
    ...options,
  };

  return fetch(url, requestOptions).then(response => {
    if (response.status < 200 || response.status >= 400) {
      throw new FetchError(`${response.status} response from ${url}`, response.status);
    }
    return response.json();
  });
}
