'use strict';

/**
 * @typedef {import('.').OutgoingMessage} OutgoingMessage
 * @typedef {import('.').Response} Response
 */

/**
 * @template {OutgoingMessage} TOutgoingMessage
 * @param {TOutgoingMessage} outgoingMessage - The outgoing message to wrap.
 * @returns {Response}
 */

const response = (outgoingMessage) => {
  /**
   * @type {Response}
   */
  const result = {
    get status() {
      return outgoingMessage.status;
    },
    get headers() {
      return outgoingMessage.headers;
    },
    get body() {
      return outgoingMessage.body;
    }
  };

  return result;
};

module.exports = {response };