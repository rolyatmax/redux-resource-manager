# redux-resource-manager
A Redux wrapper that helps manage external resources in a client-side application.

## Example usage:

First, define some external resources:

```js
const resources = {
    users: {
        buildUrl: (params) => `https://api.github.com/users/${params.username}`,
        ttl: 1000 * 60 * 5 // 5 minutes
    }
};
```

Second, wrap Redux's `createStore` method with `applyResourceManager` (note: this is similar to the way you wrap `createStore` when setting up Redux middleware):

```js
import { createStore } from 'redux';
import applyResourceManager from 'redux-resource-manager';
import rootReducer from './reducers';

const wrappedCreateStore = applyResourceManager(resources)(createStore);
const store = wrappedCreateStore(rootReducer);
```

Third, use `store.get[resourceName]` to fetch your external resources, for example:

```js
function UserInfo(props) {
    const user = store.get.users({ username: props.username });

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
}
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
        buildBatches: (requestedResources) {
            const resources = dedupe(requestedResources, params => params.username);
            return resources.map(() => (resources.splice(0, 10)));
        },

        // Your `buildUrl` function will receive a batch of params, and it must return a url.
        buildUrl: (batch) => {
            const usernames = batch.map(params => params.username);
            const usernamesQueryParam = encodeURIComponent(usernames.join(','));
            return `https://api.github.com/users?usernames=${usernamesQueryParam}`;
        },


        // For batched requests, the `parseResponse` function is required and has a slightly
        // different job. It is used to iterate over all the requested params in a batch. It is
        // `parseResponse`'s job to pull the relevant data from the batched response for the params.
        // NOTE: This API is lacking in some ways (i.e. error handling in batches, pulling out relevant data from // the batched response can be inefficient) and will most likely change. Use at your own risk!
        parseResponse: (params, batchedResponse) => {
            const user = batchedResponse.find(u => u.login === params.username);
            // handle missing user!
            return user;
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

* `store.get` used within render cycle (create `connect`-like function that accepts a function the user writes that gets passed the reducer's state and `store.get`)
* Components have to know about the cache structure (e.g. `users.result`)

## Scripts

* `npm run build` - transpiles `src` with babel, outputs to `lib`
* `npm run watch` - watches `src` and transpiles with babel on changes
* `npm run test` - runs mocha tests
* `npm run lint` - runs flow and eslint

* `npm run develop:demo` - runs webpack dev server on `:8080` for dev on demoand opens browser
* `npm run build:demo` - creates webpack bundle for demo
* `npm run serve:demo` - serves demo on `:36418` and opens browser (make sure you've `npm run build:demo` first)
