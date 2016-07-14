import test from 'tape'; // eslint-disable-line
// import applyResourceManager from './lib';
import identity from './lib/utils/identity';
// import mapObject from './lib/utils/map_object';


test('identity should return exactly what is passed to it', (t) => {
  const val = 12345;
  t.equal(val, identity(val));
  t.end();
});
