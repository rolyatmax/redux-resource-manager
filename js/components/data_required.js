import React from 'react';


const Loader = () => (<span>Loading...</span>);
const Error = () => (<span>Error loading data.</span>);


function DataRequired({requirements, children}) {
    for (let i = 0; i < requirements.length; i++) {
        let store = requirements[i];
        if (store.status === 'rejected') {
            return <Error retry={store.retry} />;
        }
        if (store.status === 'pending') {
            return <Loader />;
        }
    }

    return <div>{children}</div>;
}

DataRequired.propTypes = {
    requirements: React.PropTypes.array.isRequired,
    children: React.PropTypes.node.isRequired
};

export default DataRequired;
