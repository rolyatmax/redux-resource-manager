const test = require('tape');
const { createResourceManager } = require('./lib/index');

test('createResourceManager exists', (t) => {
    t.ok(createResourceManager);
    t.end();
});

function getConfig() {
    return {
        user: {
            buildUrl: ({ id }) => `/users/${id}`,
            ttl: 1000 * 60,
        },
    };
}

function mockPerformanceNow(time = 0) {
    global.window = { performance: { now: () => time } };
}

function mockFetch(response) {
    global.fetch = () => Promise.resolve({
        json: () => Promise.resolve(response),
    });
}


test('config', (t) => {
    const config = getConfig();
    const { getResources } = createResourceManager(config);
    t.ok(getResources.user);
    t.end();
});

test('getResource initially returns a pending response', (t) => {
    mockFetch();
    mockPerformanceNow();
    const config = getConfig();
    const { getResources } = createResourceManager(config);
    const resource = getResources.user({ id: 123 });
    t.equals(resource.status, 'pending');
    t.end();
});

test('getResource returns a fulfilled response with a successful request', (t) => {
    const config = getConfig();
    const { getResources } = createResourceManager(config);
    const data = { id: 456, username: 'username' };
    const params = { id: 456 };
    mockFetch(data);
    mockPerformanceNow();
    let resource = getResources.user(params);
    t.equals(resource.status, 'pending');
    setTimeout(() => {
        resource = getResources.user(params);
        t.equals(resource.status, 'fulfilled');
        t.equals(resource.result, data);
        t.end();
    }, 10);
});

test('getResource returns a rejected response with an unsuccessful request', (t) => {
    const config = getConfig();
    const { getResources } = createResourceManager(config);
    const error = Promise.reject('error');
    const params = { id: 456 };
    mockFetch(error);
    mockPerformanceNow();
    let resource = getResources.user(params);
    t.equals(resource.status, 'pending');
    setTimeout(() => {
        resource = getResources.user(params);
        t.equals(resource.status, 'rejected');
        t.end();
    }, 10);
});
