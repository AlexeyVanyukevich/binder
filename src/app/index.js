const { router: createRouter } = require('../http/router');
const app = createRouter();

const apiRouter = require('./api');

apiRouter.use('/api', apiRouter);

app.get('/hello', async (req, res) => {
  res.text('Hello, World!');
});

module.exports = app;