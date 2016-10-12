const test = require('tape');
const { createResourceManager } = require('./lib/index');

test('createResourceManager exists', (t) => {
  t.ok(createResourceManager);
  t.end();
});
