import React, { createElement } from 'react'; // eslint-disable-line


const defaultMergeProps = (resourceProps, parentProps) => ({
  ...parentProps,
  ...resourceProps,
});

// FIXME: don't require store to be passed in
export default function connectResourceManager(store) {
  return (mapResourcesToProps) => function wrapWithConnectResources(WrappedComponent) {
    class ConnectResources extends React.Component {
      constructor(props) {
        super(props);
        this.state = this.fetchResources(props, store.getResources);
      }

      componentWillReceiveProps(props) {
        this.setState(this.fetchResources(props, store.getResources));
      }

      fetchResources(props, getResource) {
        // TODO: only pass down the user's state
        const resources = mapResourcesToProps(props, getResource);
        const requests = Object.keys(resources).reduce((reqs, key) => {
          const resourceVal = resources[key];
          if (Array.isArray(resourceVal)) resourceVal.forEach(v => (!!v.status) && reqs.push(v));
          if (typeof resourceVal === 'object' && !!resourceVal.status) reqs.push(resourceVal);
          return reqs;
        }, []);
        return { requests, ...resources };
      }

      render() {
        const mergedProps = defaultMergeProps(this.state, this.props);
        return createElement(WrappedComponent, mergedProps);
      }
    }
    return ConnectResources;
  };
}
