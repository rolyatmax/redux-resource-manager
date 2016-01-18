import {createCacheReducerFns} from './cache';


const buildURL = ({username}) => `https://api.github.com/users/${username}`;
const ttl = 15000;
const cacheReducerFns = createCacheReducerFns({
    reducerName: 'users',
    createCacheKey: buildURL,
    requiredFieldsForFetch: ['username']
});

export const users = cacheReducerFns.reducer;
export const getAndEnsureData = cacheReducerFns.getAndEnsureData;
export const usersDataAccess = {buildURL, ttl};
