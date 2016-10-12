import React from 'react';

const defaultMergeProps = (resourceProps, parentProps) => ({
  ...parentProps,
  ...resourceProps,
});

export const buildManager = (getResources) => function manage(mapResourcesToProps) {
  return (WrappedComponent) => {
    class ConnectResources extends React.Component {
      constructor(props) {
        super(props);
        this.state = this.fetchResources(props, getResources);
      }

      componentWillReceiveProps(props) {
        this.setState(this.fetchResources(props, getResources));
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
        return React.createElement(WrappedComponent, mergedProps);
      }
          }
    return ConnectResources;
  };
};
