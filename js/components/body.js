import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import store from '../store';
import {setUser} from '../actions';
import Loader from './loader';
import UserInfo from './user_info';


function Body({users, requests, actions}) {
    function onKeyPress(e) {
        if (e.which === 13) {
            actions.setUser(e.currentTarget.value.trim());
            e.currentTarget.value = '';
        }
    }

    return (
        <div>
            <input onKeyPress={onKeyPress} type="text" />
            <Loader requests={requests} />
            <hr />
            {users.map(user =>
                <UserInfo
                    key={user.login}
                    username={user.result && user.result.login}
                    avatarURL={user.result && user.result.avatar_url}
                    {...(user.result || {})}
                />
            )}
        </div>
    );
}


export default connect(
    function mapStateToProps({appState}) {
        const users = appState.usernames.map(username => store.get.users({username}));
        const requests = users;
        return {appState, users, requests};
    },
    function mapDispatchToProps(dispatch) {
        const actions = bindActionCreators({setUser}, dispatch);
        return { actions };
    }
)(Body);
