import React from 'react';
import {connect} from 'react-redux';
import store from '../store';
import {setUser, makeFetch} from '../actions';
import DataRequired from './data_required';
import {getAndEnsureData} from '../reducers/users';


function onKeyPress(e) {
    if (e.which === 13) {
        store.dispatch(setUser(e.currentTarget.value.trim()));
        e.currentTarget.value = '';
    }
}

const App = ({appState, user}) => {
    return (
        <div>
            <h1>Github User Info</h1>
            <input onKeyPress={onKeyPress} type="text" />
            <hr />
            <DataRequired requirements={[user]}>
                <UserInfo
                    username={appState.username}
                    avatarURL={user.result && user.result.avatar_url}
                    {...user.result} />
            </DataRequired>
        </div>
    );
};

const UserInfo = ({username, avatarURL, name, company, location, followers}) =>
    <div>
        <h2>
            <img style={{width: 150, height: 150, padding: 10}} src={avatarURL} />
            {username}
        </h2>
        <h3>{name}</h3>
        <h4>{company} - {location}</h4>
        <h5>Followers: {followers}</h5>
    </div>;


export default connect(function mapStateToProps({appState, users}) {
    const fetch = (...args) => store.dispatch(makeFetch(...args));
    const user = getAndEnsureData(users, appState, fetch);
    return {appState, user};
})(App);
