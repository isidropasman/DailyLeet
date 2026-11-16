export function recordOf<K extends string, V>(keys: readonly K[], value: (key: K) => V): Record<K, V> {
  // Object.fromEntries widens keys to string; every key in `keys` is assigned, so the cast is exhaustive.
  return Object.fromEntries(keys.map(key => [key, value(key)])) as Record<K, V>;
}
