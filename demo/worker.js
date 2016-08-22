console.log('starting up');

self.cache = {};

self.addEventListener('install', (e) => {
  console.log('just installed', e);
  self.cache.installed = 'yup!';
});

self.addEventListener('fetch', (e) => {
  console.log('FETCH!', e);
  e.respondWith(
    caches.match(e.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response
        const fetchRequest = e.request.clone();
        return fetch(fetchRequest).then((res) => {
          // Check if we received a valid response
          if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have 2 stream.
          const responseToCache = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });

          return res;
        });
      })
    );
});
