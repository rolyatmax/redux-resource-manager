// FIXME: figure out why eslint is messed up here
import React from 'react'; // eslint-disable-line


const Loader = () => (<span>Loading...</span>); // eslint-disable-line
const Error = () => (<span>Error loading data.</span>); // eslint-disable-line


export default function requiresData(requirements, Component) { // eslint-disable-line
  function DataRequired(props) {
    for (let i = 0; i < requirements.length; i++) {
      const resource = requirements[i];
      if (!resource) {
        return <noscript />;
      }
      if (resource.status === 'rejected') {
        return <Error retry={resource.retry} />;
      }
      if (resource.status === 'pending') {
        return <Loader />;
      }
    }

    return <Component {...props} />;
  }

  return DataRequired;
}
