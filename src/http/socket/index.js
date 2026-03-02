/**
 * @typedef {import('.').SocketResponse} SocketResponse
 * @typedef {import('../request/method').Method} Method
 */

const { Method } = require("../request/method");

/**
 * Sends an HTTP request over an existing socket
 * @param {import('node:net').Socket | import('node:tls').TLSSocket} socket
 * @param {string} method
 * @param {string} path
 * @param {Record<string, string>} headers
 * @param {string | undefined} body
 * @returns {Promise<SocketResponse>}
 */
const sendRequest = (socket, method, path, headers, body) => {
  return new Promise((resolve, reject) => {
    const headerLines = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");

    const contentLength = body ? Buffer.byteLength(body) : 0;
    const needsContentLength =
      body ||
      method === Method.POST ||
      method === Method.PUT ||
      method === Method.PATCH;
    const contentLengthHeader = needsContentLength
      ? `\r\nContent-Length: ${contentLength}`
      : "";

    const requestStr =
      `${method} ${path || "/"} HTTP/1.1\r\n` +
      headerLines +
      contentLengthHeader +
      "\r\n\r\n" +
      (body || "");

    socket.write(requestStr);

    let responseData = "";

    socket.on("data", (chunk) => {
      responseData += chunk.toString();
    });

    socket.on("end", () => {
      try {
        const parsed = parseResponse(responseData);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });

    socket.on("error", (err) => {
      reject(new Error(`Socket error: ${err.message}`));
    });
  });
};

/**
 * Parses raw HTTP response string
 * @param {string} raw
 * @returns {SocketResponse}
 */
const parseResponse = (raw) => {
  const headerEndIndex = raw.indexOf("\r\n\r\n");
  if (headerEndIndex === -1) {
    throw new Error("Invalid HTTP response: no header/body separator");
  }

  const headerSection = raw.substring(0, headerEndIndex);
  const body = raw.substring(headerEndIndex + 4);

  const lines = headerSection.split("\r\n");
  const statusLine = lines[0];
  const statusMatch = statusLine.match(/HTTP\/\d\.\d\s+(\d+)/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

  /** @type {Record<string, string | string[]>} */
  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const colonIndex = lines[i].indexOf(":");
    if (colonIndex > 0) {
      const key = lines[i].substring(0, colonIndex).trim().toLowerCase();
      const value = lines[i].substring(colonIndex + 1).trim();
      if (headers[key]) {
        if (Array.isArray(headers[key])) {
          /** @type {string[]} */ (headers[key]).push(value);
        } else {
          headers[key] = [/** @type {string} */ (headers[key]), value];
        }
      } else {
        headers[key] = value;
      }
    }
  }

  return { status, headers, body };
};

module.exports = { sendRequest, parseResponse };
