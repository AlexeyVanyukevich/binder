const { compile: compileConstraint } = require("../../query-builder/column-definition/constraints");
const { columnDef } = require("../../query-builder/column-definition/builder");

/**
 * @typedef {import('../../query-builder').QueryBuilder} QueryBuilder
 * @typedef {import('../../query-builder').Query} Query
 * @typedef {import('../../query-builder').ConditionItem} ConditionItem
 * @typedef {import('../../query-builder').Condition} Condition
 * @typedef {import('.').PgQueryBuilder} PgQueryBuilder
 * @typedef {import('.').JoinClause} JoinClause
 */

/**
 * Rewrites `?` placeholders to `$1, $2, ...` (PostgreSQL style).
 * @param {string} sql
 * @returns {string}
 */
const rewritePlaceholders = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

/** @type {Record<string, string>} */
const PG_TYPE_MAP = {
  uuid: "UUID",
  text: "TEXT",
  integer: "INTEGER",
  smallint: "SMALLINT",
  bigint: "BIGINT",
  boolean: "BOOLEAN",
  timestamp: "TIMESTAMP",
  timestamptz: "TIMESTAMP WITH TIME ZONE",
  date: "DATE",
  time: "TIME",
  json: "JSONB",
  float: "FLOAT",
  double: "DOUBLE PRECISION",
  decimal: "DECIMAL",
  numeric: "NUMERIC",
  char: "CHAR",
  varchar: "VARCHAR",
  blob: "BYTEA",
  clob: "TEXT",
  serial: "SERIAL",
};

/**
 * @param {import('../../query-builder').ParameterizedDataType} type
 * @returns {string}
 */
const pgColumnType = (type) => {
  const base = PG_TYPE_MAP[type.name] || type.name.toUpperCase();
  if (type.params.length === 0) return base;
  return `${base}(${type.params.join(", ")})`;
};

/**
 * Wraps a base QueryBuilder with PostgreSQL dialect transformations:
 * - Rewrites `?` placeholders to `$N`
 * - SELECT supports JOIN clauses via `.join()` method
 * - INSERT supports RETURNING via `.returning()` method
 * - createTable uses PG-native type mappings
 * @param {QueryBuilder} base
 * @returns {PgQueryBuilder}
 */
const pgQueryBuilder = (base) => {
  /**
   * @param {string} table
   */
  const select = (table) => {
    const baseBuilder = base.select(table);
    /** @type {JoinClause[]} */
    const joins = [];

    const builder = {
      columns(...cols) {
        baseBuilder.columns(...cols);
        return builder;
      },
      where(condition) {
        baseBuilder.where(condition);
        return builder;
      },
      asc(column) {
        baseBuilder.asc(column);
        return builder;
      },
      desc(column) {
        baseBuilder.desc(column);
        return builder;
      },
      limit(value) {
        baseBuilder.limit(value);
        return builder;
      },
      offset(value) {
        baseBuilder.offset(value);
        return builder;
      },
      /**
       * @param {'INNER' | 'LEFT' | 'RIGHT'} type
       * @param {string} joinTable
       * @param {{ left: string, operation: string, right: string }} on
       * @param {string} [alias]
       */
      join(type, joinTable, on, alias) {
        joins.push({ type, table: joinTable, on, alias });
        return builder;
      },
      build() {
        const { sql: baseSql, params } = baseBuilder.build();

        let sql = baseSql;
        if (joins.length > 0) {
          const joinSql = joins
            .map((j) => {
              const tableRef = j.alias ? `${j.table} AS ${j.alias}` : j.table;
              return `${j.type} JOIN ${tableRef} ON ${j.on.left} ${j.on.operation} ${j.on.right}`;
            })
            .join(" ");

          // Splice JOIN clauses after FROM <table>
          const fromClause = `FROM ${table}`;
          const fromIdx = sql.indexOf(fromClause) + fromClause.length;
          sql = sql.slice(0, fromIdx) + " " + joinSql + sql.slice(fromIdx);
        }

        return { sql: rewritePlaceholders(sql), params };
      },
    };

    return builder;
  };

  /**
   * @param {string} table
   */
  const insert = (table) => {
    const baseBuilder = base.insert(table);
    let returningCols = null;

    const builder = {
      set(key, value) {
        baseBuilder.set(key, value);
        return builder;
      },
      /**
       * @param {string[] | true} [cols] - column names or true for RETURNING *
       */
      returning(cols) {
        returningCols = cols === true || cols === undefined ? "*" : cols.join(", ");
        return builder;
      },
      build() {
        const { sql: baseSql, params } = baseBuilder.build();
        const sql = returningCols
          ? `${baseSql} RETURNING ${returningCols}`
          : baseSql;
        return { sql: rewritePlaceholders(sql), params };
      },
    };

    return builder;
  };

  /**
   * @param {string} table
   */
  const update = (table) => {
    const baseBuilder = base.update(table);
    const builder = {
      set(key, value) {
        baseBuilder.set(key, value);
        return builder;
      },
      where(condition) {
        baseBuilder.where(condition);
        return builder;
      },
      build() {
        const { sql, params } = baseBuilder.build();
        return { sql: rewritePlaceholders(sql), params };
      },
    };
    return builder;
  };

  /**
   * @param {string} table
   */
  const remove = (table) => {
    const baseBuilder = base.remove(table);
    const builder = {
      where(condition) {
        baseBuilder.where(condition);
        return builder;
      },
      build() {
        const { sql, params } = baseBuilder.build();
        return { sql: rewritePlaceholders(sql), params };
      },
    };
    return builder;
  };

  /**
   * createTable with PG-native type mappings.
   * @param {string} table
   */
  const createTable = (table) => {
    /** @type {ReturnType<typeof columnDef>[]} */
    const columnBuilders = [];
    let notExists = false;

    const current = () => columnBuilders[columnBuilders.length - 1];

    const builder = {
      ifNotExists() {
        notExists = true;
        return builder;
      },
      column(name, type, ...params) {
        columnBuilders.push(columnDef(name, type, ...params));
        return builder;
      },
      primaryKey() {
        current().primaryKey();
        return builder;
      },
      notNull() {
        current().notNull();
        return builder;
      },
      unique() {
        current().unique();
        return builder;
      },
      default(value) {
        current().default(value);
        return builder;
      },
      references(refTable, refColumn) {
        current().references(refTable, refColumn);
        return builder;
      },
      build() {
        const cols = columnBuilders.map((cb) => {
          const col = cb.build();
          const parts = [col.name, pgColumnType(col.type)];
          if (col.constraints) {
            for (const c of col.constraints) {
              parts.push(compileConstraint(c));
            }
          }
          return parts.join(" ");
        });
        const exists = notExists ? "IF NOT EXISTS " : "";
        return { sql: `CREATE TABLE ${exists}${table} (${cols.join(", ")})` };
      },
    };

    return builder;
  };

  return {
    select,
    insert,
    update,
    remove,
    createTable,
    alterTable: base.alterTable,
    dropTable: base.dropTable,
  };
};

module.exports = { pgQueryBuilder };
