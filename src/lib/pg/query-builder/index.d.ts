import type {
  QueryBuilder,
  Query,
  ConditionItem,
  Condition,
  DataType,
  SelectBuilder,
  InsertBuilder,
  UpdateBuilder,
  RemoveBuilder,
  CreateTableBuilder,
  AlterTable,
  DropTable,
} from "../../query-builder";

export interface JoinClause {
  type: "INNER" | "LEFT" | "RIGHT";
  table: string;
  on: { left: string; operation: string; right: string };
  alias?: string;
}

export interface PgSelectBuilder extends SelectBuilder {
  join(
    type: "INNER" | "LEFT" | "RIGHT",
    table: string,
    on: { left: string; operation: string; right: string },
    alias?: string
  ): PgSelectBuilder;
}

export interface PgInsertBuilder extends InsertBuilder {
  returning(cols?: string[] | true): PgInsertBuilder;
}

export interface PgQueryBuilder extends Omit<QueryBuilder, "select" | "insert"> {
  select(table: string): PgSelectBuilder;
  insert(table: string): PgInsertBuilder;
}

export declare function pgQueryBuilder(base: QueryBuilder): PgQueryBuilder;
