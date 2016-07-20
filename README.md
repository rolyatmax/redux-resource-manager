# redux-resource-manager
A Redux wrapper that helps manage external resources in a client-side application.

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

[![NPM](https://nodei.co/npm/redux-resource-manager.png)](https://www.npmjs.com/package/redux-resource-manager)

## Example usage:

First, wrap Redux's `createStore` method with `applyResourceManager` and pass in a definition for the external resources you need (note: this is similar to the way you wrap `createStore` when setting up Redux middleware):

```js
import { createStore } from 'redux';
import applyResourceManager from 'redux-resource-manager';
import rootReducer from './reducers';

const resources = {
    users: {
        buildUrl: (params) => `https://api.github.com/users/${params.username}`,
        ttl: 1000 * 60 * 5 // 5 minutes
    }
};

const wrappedCreateStore = applyResourceManager(resources)(createStore);
const store = wrappedCreateStore(rootReducer);
```

Second, wrap your component with `connectResourceManager` passing in a `mapResourcesToProps` function, for example:

```js
const UserInfo = connectResourceManager(store)((props, getResource) => ({
  user: getResource.users({ username: props.username })
}))((props) => {
    const { user } = props;

    // user <-- This is a resource object. It has a few special properties:
    // user.status <-- this is the status of the request. It can be one of these three values:
    //                 ('pending' || 'fulfilled' || 'rejected')
    // user.retry <-- if a resource's status is 'rejected', this will be a function that a component
    //                can use to retry the request
    // user.result <-- if the resource's status is 'fulfilled', this will be the value returned from
    //                 the api

    if (user.status === 'pending') return <Loader />;
    if (user.status === 'rejected') return <RetryButton retry={user.retry} />;

    const { avatarURL, login, name, company, location, followers } = user.result;

    return (
        <div>
            <img src={avatarURL} />
            <h2>{login}</h2>
            <h3>{name}</h3>
            <h4>{company} - {location}</h4>
            <h5>Followers: {followers}</h5>
        </div>
    );
});
```

## Resource definitions

The resource definition API tries to find a balance between user-friendly (with sensible defaults) and flexible (for more complicated UI/API interfaces).

```js
const resources = {
    // Each key in the resources definition should be the name of the resource and is used when
    // fetching values from the store. For example: `store.get.users(params)`.
    users: {
        // Resource definitions require, at the least, `buildUrl` and `ttl` fields.
        // The `buildUrl` function receives the arguments passed to `store.get.users()`.
        buildUrl: (params) => `https://api.github.com/users/${params.username}`,
        ttl: 1000 * 60 * 5, // 5 minutes in milliseconds

        // Resource definitions can also include `parseResponse` and `createCacheKey` functions:
        parseResponse: (response) => {
            const { avatarURL, login, name, company, location, followers } = response;
            return { avatarURL, login, name, company, location, followers };
        },

        // `createCacheKey` receives the same arguments `buildUrl` receives. The expected return
        // value is a string to cache the response with. If no `createCacheKey` function is supplied
        // the url returned by `buildUrl` is used instead.
        createCacheKey: (params) => params.username
    }
};
```

## Batched requests

If your API supports batched requests, you can set up your resources definition like so:

```js
// For example, if your API accepts batched requests in the form of:
// /users?usernames=<comma-separated list of usernames>
const resources = {
    users: {
        // You must supply a `buildBatches` function which takes all the requested resources within
        // a 50ms window and should return an array of batches. In this example, we just cut up the
        // requests into batches of 10. Note: you'll probably want to dedupe the list as multiple
        // components might have requested the same resource, depending on the complexity of your app.
        buildBatches: (requestedResources) => {
            const resources = dedupe(requestedResources, params => params.username);
            return resources.map(() => (resources.splice(0, 10)));
        },

        // Your `buildUrl` function will receive a batch of params, and it must return a url.
        buildUrl: (batch) => {
            const usernames = batch.map(params => params.username);
            const usernamesQueryParam = encodeURIComponent(usernames.join(','));
            return `https://api.github.com/users?usernames=${usernamesQueryParam}`;
        },


        // For batched requests, the `unbatchResponse` function is required. It is used to map the
        // requested resources' params to the relevant part of the response.
        // NOTE: This API is lacking in some ways and will most likely change in the future.
        // Use at your own risk!
        unbatchResponse: (batchedParams, batchedResponse) => {
            const users = {};
            batchedResponse.forEach(u => users[u.login] = u);
            const fulfilled = [];
            const rejected = [];

            batchedParams.forEach(params => {
              const user = users[params.username];
              if (!user || typeof user === 'string') {
                rejected.push({
                  params,
                  error: user || `${params.username} not found in response`
                });
              } else {
                fulfilled.push({
                  params,
                  result: user
                });
              }
            });
            return { fulfilled, rejected };
        },

        // For batched requests, `createCacheKey` is also required. It receives a requested params object
        // and should return a string to cache the result with.
        createCacheKey: (params) => params.username,

        ttl: 1000 * 60 * 5, // 5 minutes in milliseconds
    }
};
```

## Goals

* Colocate data requirements with a component
* Provide data caching
* Declaratively define external resources
* Provide easy way to manage showing `Loader` and `Error` components (and retry ajax requests)

## FIXMEs

* the entire store gets passed to components
* the store must be explicitly passed to `connectResourceManager`
* Components have to know about the cache structure (e.g. `users.result`)
* Provide sensible default for batching/deduping? For example:
```js
{
  ...,
  batchSize: 10,
  dedupeWithField: (params) => params.username,
}
```

## Scripts

To develop against the demo:

```shell
npm run batching-server
npm run develop:demo
```

Also, important:

* `npm run test` - runs mocha tests
* `npm run lint` - runs eslint

For a list of all the scripts, run `npm run` from this project's root.

## License

MIT, see [LICENSE.md](http://github.com/rolyatmax/redux-resource-manager/blob/master/LICENSE.md) for details.
