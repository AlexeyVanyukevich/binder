const { pool } = require('../pool');

/**
 * @typedef {import('.').EventEmitter} EventEmitter
 * @typedef {import('.').EventHandler} EventHandler
 */

/**
 * Creates an event emitter with multiple listeners per event type.
 * Built on top of the generic pool for handler management.
 * @returns {EventEmitter}
 */
const eventEmitter = () => {
  /** @type {import('../pool').Pool<EventHandler>} */
  const handlers = pool();

  /**
   * @param {string} type
   * @param {EventHandler} handler
   */
  const on = (type, handler) => {
    handlers.add(type, handler);
  };

  /**
   * @param {string} type
   * @param {EventHandler} handler
   */
  const off = (type, handler) => {
    handlers.remove(type, handler);
  };

  /**
   * @param {string} type
   * @param {EventHandler} handler
   */
  const once = (type, handler) => {
    /** @type {EventHandler} */
    const wrapper = async (data) => {
      handlers.remove(type, wrapper);
      return handler(data);
    };
    handlers.add(type, wrapper);
  };

  /**
   * Emits an event to all registered handlers without waiting for responses.
   * @param {string} type
   * @param {any} data
   */
  const emit = (type, data) => {
    for (const handler of handlers.get(type)) {
      handler(data).catch(console.error);
    }
  };

  return { on, off, once, emit };
};

module.exports = { eventEmitter };
