export default {
  users: {
    buildUrl: (params) => `https://api.github.com/users/${params.username}`,
    ttl: 1000 * 15, // 15 seconds
  },
};
