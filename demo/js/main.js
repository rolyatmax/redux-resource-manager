// FIXME: figure out why eslint is messed up here
import React from 'react'; // eslint-disable-line
import ReactDOM from 'react-dom'; // eslint-disable-line
import { Provider } from 'react-redux'; // eslint-disable-line
import store from './store';
import App from './components/app'; // eslint-disable-line


navigator.serviceWorker.register('worker.js').then((registration) => {
  console.log('did it!', registration);
}).catch((err) => {
  console.log('ServiceWorker registration failed: ', err);
});

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.querySelector('#container')
);
