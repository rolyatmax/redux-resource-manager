function dedupe(list, getPropertyFn = (val) => val) {
  const itemsSeen = {};
  const dedupedList = [];
  list.forEach(item => {
    const prop = getPropertyFn(item);
    if (!itemsSeen[prop]) {
      dedupedList.push(item);
    }
    itemsSeen[prop] = true;
  });
  return dedupedList;
}

export default {
  users: {
    buildUrl: (params) => `https://api.github.com/users/${params.username}`,
    ttl: 1000 * 15, // 15 seconds
  },

  batchedUsers: {
    buildBatches: (requestedResources) => {
      const resources = dedupe(requestedResources, params => params.username);
      return resources.map(() => (resources.splice(0, 10)));
    },
    buildUrl: (batch) => {
      const usernames = batch.map(params => params.username);
      return `http://localhost:1213/users?usernames=${usernames.join(',')}`;
    },
    unbatchResponse: (batchedParams, batchedResponse) => {
      const users = {};
      batchedResponse.forEach(u => {
        users[u.login] = u;
      });
      const fulfilled = [];
      const rejected = [];
      batchedParams.forEach(params => {
        const user = users[params.username];
        if (!user || user.error) {
          rejected.push({
            params,
            error: user ? user.error : `${params.username} not found in response`,
          });
        } else {
          fulfilled.push({
            params,
            result: user,
          });
        }
      });
      return { fulfilled, rejected };
    },
    createCacheKey: (params) => params.username,
    ttl: 1000 * 15, // 15 seconds
  },
};
