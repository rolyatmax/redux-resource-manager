# react-github-example
An example of how to handle the data layer in react (with Github's API)

## The parts

* DataAccess middleware
* DataRequired component
* Cache reducer
* FETCH, DATA_RECEIVED, and ERROR actions
* getAndEnsureData - used in connect

## Goals

* Colocate data requirements with a component
* Provide data caching
* Declaratively define data access
* Provide easy way to manage showing `Loader` and `Error` components (and retry ajax requests)

## FIXMEs

* `getAndEnsureData` used within render cycle
* User shouldn't have to know about `getAndEnsureData`
* `DataRequired`'s children are instantiated when `DataRequired` is (should wrap a component like `connect`)
* `Loader` & `Error` components are defined within `DataRequired`
* DataAccess middleware knows about action creators
* Components have to know about the cache structure (e.g. `users.result`)


## Possible API for new `DataRequired` wrapper?:

```js
ChildComponent = dataRequired(
    function getRequestProps({appState}) {
        return {
            'users': {username: appState.username}
        };
    },
    {
        loaderComponent: Loader,
        errorComponent: Error
    }
)(ChildComponent);
```

## Scripts

* `npm run test` - runs mocha tests
* `npm run watch` - runs watchify with sourcemaps
* `npm run build` - runs browserify, using react's production build
* `npm run serve` - runs SimpleHTTPServer on `5526` and opens browser
* `npm run lint` - runs eslint
