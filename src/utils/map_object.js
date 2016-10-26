/* @flow */

export default function mapObject<T, U>(
    obj: {[key:string]: T},
    mapFn: (value:T, key: string) => U
):{[key:string]: U} {
    return Object.keys(obj).reduce((into, key) => {
        into[key] = mapFn(obj[key], key);
        return into;
    }, {});
}
