"use strict";

const { StatusCode } = require("../../response/status-code");
const { ContentType } = require("../../content-type");

const { response: createResponse } = require("../../response");

/**
 * @typedef {import('node:http').ServerResponse} ServerResponse
 * @typedef {StatusCodes} StatusCode
 * @typedef {import('.').ServerResponse} Response
 */

/**
 * A function to map `ServerResponse` to a custom `Response` type.
 * @param {ServerResponse} serverResponse
 * @returns {Response}
 */
const response = (serverResponse) => {
  let responseBody = "";

  const baseResponse = createResponse({
    get status() {
      return serverResponse.statusCode;
    },
    get headers() {
      return serverResponse.getHeaders();
    },
    get body() {
      return responseBody;
    },
  });
  /**
   * Sets the HTTP status code and returns the response object.
   * @param {StatusCode} statusCode - HTTP status code.
   * @returns {Response} The response object.
   */
  const setStatus = (statusCode) => {
    serverResponse.statusCode = statusCode;

    return res;
  };

  /**
   * Sends a 200 OK response with no body.
   * @returns {void}
   */
  const ok = () => {
    setStatus(StatusCode.OK);
    serverResponse.end();
  };

  /**
   * Sends an HTML response with a 200 OK status.
   * @param {string} html - HTML content to send.
   * @returns {void}
   */
  const html = (html) => {
    serverResponse.setHeader(Header.ContentType, ContentType.Html);
    setStatus(StatusCode.OK);
    responseBody = html;
    serverResponse.end(html);
  };

  /**
   * Sends a plain text response with a 200 OK status.
   * @param {string} text - Text content to send.
   * @returns {void}
   */
  const text = (text) => {
    serverResponse.setHeader(Header.ContentType, ContentType.Text);
    setStatus(StatusCode.OK);
    responseBody = text;
    serverResponse.end(text);
  };
  /**
   * Sends a JSON response with a 200 OK status.
   * @param {object|string} json - JSON object or string to send.
   * @returns {void}
   */
  const json = (json) => {
    serverResponse.setHeader(Header.ContentType, ContentType.Json);
    setStatus(StatusCode.OK);
    responseBody = typeof json === "string" ? json : JSON.stringify(json);
    serverResponse.end(responseBody);
  };
  /**
   * Sends binary data (e.g., file buffer) with a 200 OK status.
   * @param {Buffer} buffer - The binary data to send.
   * @returns {void}
   */
  const blob = (buffer) => {
    serverResponse.setHeader(Header.ContentType, ContentType.OctetStream);
    setStatus(StatusCode.OK);
    responseBody = buffer.toString();
    serverResponse.end(buffer);
  };

  /**
   * Sends a response based on the type of the provided body.
   * If no content type is set, it infers it from the body type.
   * @param {*} [body] - The response body (string, buffer, object, etc.).
   * @returns {void}
   */
  const send = (body) => {
    if (body === null || body === undefined) {
      ok();
      return;
    }

    if (!serverResponse.getHeader(Header.ContentType)) {
      if (typeof body === "string") {
        text(body);
      } else if (Buffer.isBuffer(body)) {
        blob(body);
      } else if (typeof body === "object") {
        json(body);
      } else {
        text(body.toString());
      }
      return;
    }

    serverResponse.end(body);
  };

  /**
   * Sets the status code and ends the response without a body.
   * @param {StatusCode} statusCode - HTTP status code.
   * @returns {void}
   */
  const sendStatus = (statusCode) => {
    setStatus(statusCode);

    serverResponse.end();
  };

  /**
   * Sends a 404 Not Found response.
   * @returns {void}
   */
  const notFound = () => {
    setStatus(StatusCode.NotFound).send();
  };

  /**
   * Sends a 500 Internal Server Error response.
   * @returns {void}
   */
  const internalServerError = () => {
    setStatus(StatusCode.InternalServerError).send();
  };

  const result = {
    ok,
    html,
    json,
    text,
    send,
    blob,
    setStatus,
    sendStatus,
    notFound,
    internalServerError,
    get status() {
      return serverResponse.statusCode;
    },
    get headers() {
      return serverResponse.getHeaders();
    },
    get body() {
      return responseBody;
    },
  };

  return result;
};

module.exports = { response };
