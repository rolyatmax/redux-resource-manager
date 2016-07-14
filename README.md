# react-data-access
A Redux wrapper that helps manage external resources in a client-side application.

## Example usage:

```js
// First, define some external resources:

const resources = {
    users: {
        buildUrl: (params) => `https://api.github.com/users/${params.username}`,
        ttl: 1000 * 60 * 5 // 5 minutes
    }
};

// --------------------------------------------

// Second, wrap Redux's createStore method with applyResourceManager
// (note: this is similar to the way you wrap createStore when setting up Redux middleware):

import { createStore } from 'redux';
import applyResourceManager from 'redux-resource-manager';
import rootReducer from './reducers';

const wrappedCreateStore = applyResourceManager(resources)(createStore);
const store = wrappedCreateStore(rootReducer);

// --------------------------------------------

// Third, use store.get[resourceName] to fetch your external resources, for example:

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

    const {avatarURL, login, name, company, location, followers} = user.result;

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

## Goals

* Colocate data requirements with a component
* Provide data caching
* Declaratively define external resources
* Provide easy way to manage showing `Loader` and `Error` components (and retry ajax requests)

## FIXMEs

* `store.get` used within render cycle (create `connect`-like function that accepts a function the user writes
    that gets passed the reducer's state and `store.get`)
* Components have to know about the cache structure (e.g. `users.result`)

## Scripts

* `npm run test` - runs mocha tests
* `npm run watch` - runs watchify with sourcemaps
* `npm run build` - runs browserify, using react's production build
* `npm run serve` - runs SimpleHTTPServer on `5526` and opens browser
* `npm run lint` - runs eslint
