const { createDefaultConfig, setup } = require('./config');
const cfg = createDefaultConfig();

const appConfig = setup(cfg, '', {
  port: 'number'
});

const { server: createServer } = require('./http');
const app = require('./app');

const server = createServer(app);

server.use

server.listen(appConfig.port);