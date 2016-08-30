class FetchError extends Error {
  constructor(msg, statusCode) {
    super(msg);
    this.statusCode = statusCode;
  }
}

export default function fetchJSON(url, options = {}) {
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
