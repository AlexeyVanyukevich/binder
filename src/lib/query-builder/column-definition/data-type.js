const DATA_TYPE = Object.freeze({
  UUID: "uuid",
  TEXT: "text",
  INTEGER: "integer",
  SMALLINT: "smallint",
  BIGINT: "bigint",
  BOOLEAN: "boolean",
  TIMESTAMP: "timestamp",
  DATE: "date",
  TIME: "time",
  JSON: "json",
  FLOAT: "float",
  DOUBLE: "double",
  DECIMAL: "decimal",
  NUMERIC: "numeric",
  CHAR: "char",
  VARCHAR: "varchar",
  BLOB: "blob",
  CLOB: "clob",
  SERIAL: "serial",
});

const COLUMN_TYPE_MAP = {
  [DATA_TYPE.UUID]: "CHAR(36)",
  [DATA_TYPE.TEXT]: "TEXT",
  [DATA_TYPE.INTEGER]: "INTEGER",
  [DATA_TYPE.SMALLINT]: "SMALLINT",
  [DATA_TYPE.BIGINT]: "BIGINT",
  [DATA_TYPE.BOOLEAN]: "BOOLEAN",
  [DATA_TYPE.TIMESTAMP]: "TIMESTAMP",
  [DATA_TYPE.DATE]: "DATE",
  [DATA_TYPE.TIME]: "TIME",
  [DATA_TYPE.JSON]: "TEXT",
  [DATA_TYPE.FLOAT]: "FLOAT",
  [DATA_TYPE.DOUBLE]: "DOUBLE PRECISION",
  [DATA_TYPE.DECIMAL]: "DECIMAL",
  [DATA_TYPE.NUMERIC]: "NUMERIC",
  [DATA_TYPE.CHAR]: "CHAR",
  [DATA_TYPE.VARCHAR]: "VARCHAR",
  [DATA_TYPE.BLOB]: "BLOB",
  [DATA_TYPE.CLOB]: "CLOB",
  [DATA_TYPE.SERIAL]: "INTEGER",
};

/** @type {import('.').ColumnType} */
const columnType = (type) => {
  const base = COLUMN_TYPE_MAP[type.name] || type.name.toUpperCase();
  if (type.params.length === 0) return base;
  return `${base}(${type.params.join(", ")})`;
};

/** @type {import('.').DataTypeBuilder} */
const dataType = (name, ...params) => ({ name, params });

module.exports = { DATA_TYPE, columnType, dataType };
