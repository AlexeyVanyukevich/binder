/**
 * @template T
 * @typedef {import('.').Pool} Pool<T>
 */

/**
 * Creates a generic keyed pool for managing sets of items by key.
 * Can be used for connections, handlers, agents, or any grouped resources.
 * @template T
 * @returns {Pool<T>}
 */
const pool = () => {
  /** @type {Map<string, Set<T>>} */
  const map = new Map();

  /**
   * @param {string} key
   * @returns {Set<T>}
   */
  const get = (key) => {
    let set = map.get(key);
    if (!set) {
      set = new Set();
      map.set(key, set);
    }
    return set;
  };

  /**
   * @param {string} key
   * @param {T} item
   */
  const add = (key, item) => {
    get(key).add(item);
  };

  /**
   * @param {string} key
   * @param {T} item
   */
  const remove = (key, item) => {
    const set = map.get(key);
    if (set) {
      set.delete(item);
      if (set.size === 0) map.delete(key);
    }
  };

  /**
   * @param {string} key
   * @returns {boolean}
   */
  const has = (key) => {
    const set = map.get(key);
    return !!set && set.size > 0;
  };

  /**
   * @param {string} key
   */
  const clear = (key) => {
    map.delete(key);
  };

  /**
   * @param {string} key
   * @returns {number}
   */
  const size = (key) => {
    const set = map.get(key);
    return set ? set.size : 0;
  };

  return { add, remove, get, has, clear, size };
};

module.exports = { pool };
