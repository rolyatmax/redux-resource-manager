import React from 'react';


const Loader = () => (<span>Loading...</span>);
const Error = () => (<span>Error loading data.</span>);


export default function requiresData(requirements, Component) {
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
