const { StatusCode } = require('./status-code');
const { Header } = require('./header');
const { ContentType } = require('./content-type');

/**
 * @typedef {import('node:http').ServerResponse} ServerResponse
 * @typedef {StatusCodes} StatusCode
 * @typedef {import('.').Response} Response
 */

/**
 * A function to map `ServerResponse` to a custom `Response` type.
 * @param {ServerResponse} serverResponse
 * @returns {Response}
 */
const response = (serverResponse) => {
  /**
   * Sets the HTTP status code and returns the response object.
   * @param {StatusCode} statusCode - HTTP status code.
   * @returns {Response} The response object.
   */
  const status = (statusCode) => {
    serverResponse.statusCode = statusCode;

    return response;
  };

  /**
   * Sends a 200 OK response with no body.
   * @returns {void}
   */
  const ok = () => {
    status(StatusCode.OK);
    serverResponse.end();
  };

  /**
   * Sends an HTML response with a 200 OK status.
   * @param {string} html - HTML content to send.
   * @returns {void}
   */
  const html = (html) => {
    serverResponse.setHeader(Header.ContentType, ContentType.Html);
    status(StatusCode.OK);
    serverResponse.end(html);
  };

  /**
   * Sends a plain text response with a 200 OK status.
   * @param {string} text - Text content to send.
   * @returns {void}
   */
  const text = (text) => {
    serverResponse.setHeader(Header.ContentType, ContentType.Text);
    status(StatusCode.OK);
    serverResponse.end(text);
  };
  /**
   * Sends a JSON response with a 200 OK status.
   * @param {object|string} json - JSON object or string to send.
   * @returns {void}
   */
  const json = (json) => {
    serverResponse.setHeader(Header.ContentType, ContentType.Json);
    status(StatusCode.OK);
    const body = typeof json === 'string' ? json : JSON.stringify(json);
    serverResponse.end(body);
  };
  /**
   * Sends binary data (e.g., file buffer) with a 200 OK status.
   * @param {Buffer} buffer - The binary data to send.
   * @returns {void}
   */
  const blob = (buffer) => {
    serverResponse.setHeader(Header.ContentType, ContentType.OctetStream);
    status(StatusCode.OK);
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
      if (typeof body === 'string') {
        text(body);
      } else if (Buffer.isBuffer(body)) {
        blob(body);
      } else if (typeof body === 'object') {
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
    status(statusCode);

    serverResponse.end();
  };

  /**
   * Sends a 404 Not Found response.
   * @returns {void}
   */
  const notFound = () => {
    status(StatusCode.NotFound).send();
  };

  /**
   * Sends a 500 Internal Server Error response.
   * @returns {void}
   */
  const internalServerError = () => {
    status(StatusCode.InternalServerError).send();
  };

  /**
   * The response object containing utility methods for sending various types of responses.
   * @type {Response}
   */
  const response = {
    ok,
    html,
    json,
    text,
    send,
    blob,
    status,
    sendStatus,
    notFound,
    internalServerError
  };

  return response;
};

module.exports = {response };