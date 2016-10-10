import applyResourceManager,
    { RESOURCE_FETCH, RESOURCE_RECEIVED, RESOURCE_ERROR } from './apply_resource_manager';
import connectResourceManager from './connect_resource_manager';

module.exports = {
  applyResourceManager: applyResourceManager,
  connectResourceManager: connectResourceManager,
  RESOURCE_FETCH,
  RESOURCE_RECEIVED,
  RESOURCE_ERROR,
};
