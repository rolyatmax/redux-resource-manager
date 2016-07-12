import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import store from '../store';
import {setUser} from '../actions';
import requiresData from './data_required';


const UserInfo = ({username, avatarURL, name, company, location, followers}) => (
    <div>
        <h2>
            <img style={{width: 150, height: 150, padding: 10}} src={avatarURL} />
            {username}
        </h2>
        <h3>{name}</h3>
        <h4>{company} - {location}</h4>
        <h5>Followers: {followers}</h5>
    </div>
);

const App = ({appState, user, actions}) => {
    const WrappedUserInfo = requiresData([user], UserInfo);
    function onKeyPress(e) {
        if (e.which === 13) {
            actions.setUser(e.currentTarget.value.trim());
            e.currentTarget.value = '';
        }
    }

    return (
        <div>
            <h1>Github User Info</h1>
            <input onKeyPress={onKeyPress} type="text" />
            <hr />
            <WrappedUserInfo
                username={appState.username}
                avatarURL={user && user.result && user.result.avatar_url}
                {...(user ? user.result : {})}
            />
        </div>
    );
};

export default connect(
    function mapStateToProps({appState}) {
        let user = appState.username ? store.get.users(appState) : null;
        return {appState, user};
    },
    function mapDispatchToProps(dispatch) {
        return {
            actions: bindActionCreators({setUser}, dispatch)
        };
    }
)(App);
