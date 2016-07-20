// FIXME: figure out why eslint is messed up here
import React from 'react'; // eslint-disable-line
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux'; // eslint-disable-line
import store from '../store';
import { connectResourceManager } from '../../../src';
import { setUser } from '../actions';
import Loader from './loader'; // eslint-disable-line
import UserInfo from './user_info'; // eslint-disable-line


const Body = connectResourceManager(store)(({ appState }, getResource) => ({
  users: appState.usernames.map(username => getResource.batchedUsers({ username })),
}))((props) => {
  const { actions, users, requests } = props;

  function onKeyPress(e) {
    if (e.which === 13) {
      actions.setUser(e.currentTarget.value.trim());
    }
  }

  return (
    <div>
      <input onKeyPress={onKeyPress} type="text" />
      <Loader requests={requests} />
      <hr />
      {users.filter(user => user.result).map((user) =>
        <UserInfo
          key={user.result.login}
          username={user.result && user.result.login}
          avatarURL={user.result && user.result.avatar_url}
          {...(user.result || {})}
        />
      )}
    </div>
  );
});

// TODO: maybe make this all more opinionated by only letting user create an `appState` reducer??
export default connect(
  (state) => state,
  (dispatch) => ({ actions: bindActionCreators({ setUser }, dispatch) })
)(Body);
