/* @flow */
export type URLOptions = {
    url: string,
    fetchOptions: {},
}

type Params = {}

type ConfigInterface = {
    buildUrl: (params: Params) => (string | URLOptions)
}

export function getUrlAndFetchOptions(
    resourceConfig: ConfigInterface,
    params: {},
):URLOptions {
    const { buildUrl } = resourceConfig;
    const buildUrlResult = buildUrl(params);
    if (typeof buildUrlResult === 'string') {
        return {
            url: buildUrlResult,
            fetchOptions: {},
        };
    }
    const { url, ...fetchOptions } = buildUrlResult;
    return { url, fetchOptions };
}
