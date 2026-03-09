const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

/**
 * @template T
 * @typedef {import('..').Store<T>} Store
 */

/**
 * @typedef {import('.').JsonStoreOptions} JsonStoreOptions
 */

const { DEFAULT_ID_FIELD } = require("../defaults");

/**
 * Reads records from the JSON file.
 * @template T
 * @param {string} filePath
 * @returns {Promise<T[]>}
 */
const readFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
};

/**
 * Writes records to the JSON file.
 * @template T
 * @param {string} filePath
 * @param {T[]} records
 * @returns {Promise<void>}
 */
const writeFile = async (filePath, records) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf-8");
};

/**
 * Creates a JSON file-backed store implementation.
 * @template T
 * @param {JsonStoreOptions} options
 * @returns {Store<T>}
 */
const json = (options) => {
  if (!options) {
    throw new Error("JsonStoreOptions are required");
  }
  if (!options.filePath) {
    throw new Error("filePath is required");
  }
  const { filePath, idField = DEFAULT_ID_FIELD } = options;

  /**
   * @param {Partial<T>} item
   * @returns {T}
   */
  const create = async (item) => {
    const id = crypto.randomUUID();
    /** @type {T} */
    const record = /** @type {T} */ ({ [idField]: id, ...item });
    const records = await readFile(filePath);
    records.push(record);
    await writeFile(filePath, records);
    return record;
  };

  /**
   * @param {string} id
   * @returns {Promise<T | undefined>}
   */
  const get = async (id) => {
    const records = await readFile(filePath);
    return records.find((r) => r[idField] === id);
  };

  /** @returns {Promise<T[]>} */
  const list = async () => readFile(filePath);

  /**
   * @param {string} id
   * @param {Partial<T>} updates
   * @returns {Promise<T | undefined>}
   */
  const update = async (id, updates) => {
    const records = await readFile(filePath);
    const index = records.findIndex((r) => r[idField] === id);
    if (index === -1) return undefined;
    /** @type {T} */
    const updated = { ...records[index], ...updates, [idField]: id };
    records[index] = updated;
    await writeFile(filePath, records);
    return updated;
  };

  /**
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  const remove = async (id) => {
    const records = await readFile(filePath);
    const index = records.findIndex((r) => r[idField] === id);
    if (index === -1) return false;
    records.splice(index, 1);
    await writeFile(filePath, records);
    return true;
  };

  return { create, get, list, update, delete: remove };
};

module.exports = { json };
