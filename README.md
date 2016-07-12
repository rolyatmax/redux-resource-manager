# react-data-access
An example of how you might handle data access with react+redux (with Github's API)

## The parts

* resources definitions
* `requiresData` wrapper
* `get` functions used for fetching data from the data layer - used in connect

## Goals

* Colocate data requirements with a component
* Provide data caching
* Declaratively define external resources
* Provide easy way to manage showing `Loader` and `Error` components (and retry ajax requests)

## FIXMEs

* `getAndEnsureData` used within render cycle
* `Loader` & `Error` components are defined within `DataRequired`
* Components have to know about the cache structure (e.g. `users.result`)


## Possible API for new `DataRequired` wrapper?:

```js
ChildComponent = dataRequired(
    function getRequestProps({appState, users}) {
        return {
            'user': [users, {username: appState.username}]
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
