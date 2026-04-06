const appConfigSchema = {
  port: { type: "number", default: 3000 },
  auth: {
    secret: { type: "string", required: true },
  },
};

module.exports = { appConfigSchema };
