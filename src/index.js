/**
 * @typedef {import('.').AppConfig} AppConfig
 */

const { createDefaultConfig } = require("./config");
const cfg = createDefaultConfig();

/** @type {AppConfig} */
const appConfig = cfg.setup({
  port: "number",
});

const { server: createServer } = require("./http");
const { appRouter } = require("./app");

const app = appRouter(cfg);
const server = createServer(app);

server.listen(appConfig.port, () => {
  console.log(`Server is listening on port ${appConfig.port}`);
});
