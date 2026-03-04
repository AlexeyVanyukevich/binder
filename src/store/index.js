/**
 * @template T
 * @typedef {import('.').DataAccess<T>} DataAccess
 */

/**
 * @template T
 * @typedef {import('.').Store<T>} Store
 */

/**
 * Creates a generic store with CRUD operations backed by a data access layer.
 * @template T
 * @param {DataAccess<T>} dataAccess
 * @returns {Store<T>}
 */
const store = (dataAccess) => {
  /**
   * @param {string} id
   * @param {T} item
   * @returns {T}
   */
  const create = (id, item) => {
    dataAccess.set(id, item);
    return item;
  };

  /**
   * @param {string} id
   * @returns {T | undefined}
   */
  const get = (id) => dataAccess.get(id);

  /** @returns {T[]} */
  const list = () => dataAccess.getAll();

  /**
   * @param {string} id
   * @param {Partial<T>} updates
   * @returns {T | undefined}
   */
  const update = (id, updates) => {
    const existing = dataAccess.get(id);
    if (!existing) return undefined;
    /** @type {T} */
    const updated = { ...existing, ...updates };
    dataAccess.set(id, updated);
    return updated;
  };

  /**
   * @param {string} id
   * @returns {boolean}
   */
  const remove = (id) => dataAccess.delete(id);

  return { create, get, list, update, delete: remove };
};

module.exports = { store };
