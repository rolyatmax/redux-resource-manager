import React from 'react';


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

UserInfo.propTypes = {
    username: React.PropTypes.string.isRequired,
    avatarURL: React.PropTypes.string.isRequired,
    name: React.PropTypes.string,
    company: React.PropTypes.string,
    location: React.PropTypes.string,
    followers: React.PropTypes.number
};

export default UserInfo;
