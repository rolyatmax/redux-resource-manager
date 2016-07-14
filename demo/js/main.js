// FIXME: figure out why eslint is messed up here
import React from 'react'; // eslint-disable-line
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'; // eslint-disable-line
import store from './store';
import App from './components/app'; // eslint-disable-line

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.querySelector('#container')
);
