export function setUser(usernames) {
    const type = 'SET_USER';
    usernames = usernames.split(',').map(user => user.trim()).filter(val => val);
    return {type, usernames};
}
