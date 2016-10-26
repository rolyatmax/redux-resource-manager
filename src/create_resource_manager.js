/* @flow */
import { createStore } from './create_store';
import { applyDefaults } from './resource_config';
import type { BaseResourceConfigMap } from './resource_config';
import { createSelectorMap } from './create_selector';
import type { ResourceEventHandlers } from './external_handlers';
import { createManager } from './manager_component';
import type { Manager } from './manager_component';

// TODO: allow passing in own store?
export function createResourceManager(
    baseConfig: BaseResourceConfigMap,
    eventHandlers: ResourceEventHandlers
):{ manager: Manager } {
    const resourceConfigs = applyDefaults(baseConfig);
    const store = createStore(resourceConfigs, eventHandlers);
    const getResources = createSelectorMap(resourceConfigs, store);
    const manager = createManager(getResources);

    return { manager, getResources };
}
