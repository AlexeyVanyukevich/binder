/**
 * @typedef {import('./schema/app-config').AppConfig} AppConfig
 */

const { createDefaultConfig } = require("./config");
const { appConfigSchema } = require("./schema/app-config");
const cfg = createDefaultConfig();

const { server: createServer } = require("./http/server");
const { appRouter } = require("./app");

/** @type {AppConfig} */
const appConfig = cfg.setup(appConfigSchema);

const server = createServer(router => appRouter(cfg, router));

server.listen(appConfig.port, () => {
  console.log(`Server is listening on port ${appConfig.port}`);
});
