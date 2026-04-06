const { createDefaultConfig } = require("./lib/config");
const { server: createServer } = require("./lib/http/server");
const { pg } = require("./lib/pg");
const { queryBuilder } = require("./lib/query-builder");
const { pgQueryBuilder } = require("./lib/pg/query-builder");
const { eventEmitter } = require("./lib/event-emitter");
const { appRouter } = require("./app");

const config = createDefaultConfig();
const db = pg(config);
const qb = pgQueryBuilder(queryBuilder());
const bus = eventEmitter();

/** @type {import('./app/context').AppContext} */
const ctx = { db, config, qb, bus };

const server = createServer(appRouter(ctx));

const port = config.getOrDefault("port", 3000);
server.listen(Number(port), () => {
  console.log(`Server is listening on port ${port}`);
});
