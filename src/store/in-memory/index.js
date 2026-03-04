const crypto = require("node:crypto");

/**
 * @template T
 * @typedef {import('..').Store<T>} Store
 */

/**
 * @typedef {import('..').StoreOptions} StoreOptions
 */

const DEFAULT_ID_FIELD = "id";

/**
 * Creates an in-memory store implementation.
 * @template T
 * @param {StoreOptions} [options]
 * @returns {Store<T>}
 */
const inMemory = (options) => {
  const idField = (options && options.idField) || DEFAULT_ID_FIELD;
  /** @type {Map<string, T>} */
  const map = new Map();

  /**
   * @param {Partial<T>} item
   * @returns {T}
   */
  const create = (item) => {
    const id = crypto.randomUUID();
    /** @type {T} */
    const record = /** @type {T} */ ({ [idField]: id, ...item });
    map.set(id, record);
    return record;
  };

  /**
   * @param {string} id
   * @returns {Promise<T | undefined>}
   */
  const get = async (id) => map.get(id);

  /** @returns {Promise<T[]>} */
  const list = async () => Array.from(map.values());

  /**
   * @param {string} id
   * @param {Partial<T>} updates
   * @returns {Promise<T | undefined>}
   */
  const update = async (id, updates) => {
    const existing = map.get(id);
    if (!existing) return undefined;
    /** @type {T} */
    const updated = { ...existing, ...updates, [idField]: id };
    map.set(id, updated);
    return updated;
  };

  /**
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  const remove = async (id) => map.delete(id);

  return { create, get, list, update, delete: remove };
};

module.exports = { inMemory };
