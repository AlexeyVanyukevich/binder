const path = require("node:path");
const { createDefaultConfig } = require("./lib/config");
const { pg } = require("./lib/pg");
const { migration } = require("./lib/migration");

const config = createDefaultConfig();
const db = pg(config);
const runner = migration(db, path.join(__dirname, "migrations"));

const command = process.argv[2];

(async () => {
  try {
    if (command === "down") {
      await runner.down(1);
    } else {
      await runner.up();
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
