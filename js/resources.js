export default {
    users: {
        buildUrl: ({username}) => `https://api.github.com/users/${username}`,
        ttl: 1000 * 15 // 15 seconds
    }
};
