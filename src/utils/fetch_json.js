export default function fetchJSON(url, options = {}) {
  const requestOptions = {
    credentials: 'same-origin',
    ...options,
  };

  return fetch(url, requestOptions).then(response => {
    if (response.status < 200 || response.status >= 400) {
      throw new Error(`${response.status} response from ${url}`);
    }
    return response.json();
  });
}
