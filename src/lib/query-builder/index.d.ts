// === Core ===

export interface Query {
  sql: string;
  params?: unknown[];
}

export type Compiler<T, R = string> = (node: T) => R;

// === Condition Item ===

export type Operation = "=" | "!=" | "<" | ">" | "<=" | ">=" | "LIKE" | "IN";

export interface ConditionItem {
  left: string;
  operation: Operation;
  right: unknown;
}

export interface ConditionItemBuilder {
  eq(value: unknown): ConditionItemBuilder;
  neq(value: unknown): ConditionItemBuilder;
  lt(value: unknown): ConditionItemBuilder;
  gt(value: unknown): ConditionItemBuilder;
  lte(value: unknown): ConditionItemBuilder;
  gte(value: unknown): ConditionItemBuilder;
  like(value: unknown): ConditionItemBuilder;
  in(value: unknown): ConditionItemBuilder;
  build(): ConditionItem;
}

export type ConditionItemCompiler = Compiler<ConditionItem, Query>;

export declare function conditionItem(field: string): ConditionItemBuilder;

// === Condition ===

export type Logic = "AND" | "OR";

export interface Condition {
  logic?: Logic;
  children: (ConditionItem | Condition)[];
}

export interface ConditionBuilder_ {
  and(): ConditionBuilder_;
  or(): ConditionBuilder_;
  add(child: ConditionItem | Condition): ConditionBuilder_;
  build(): Condition;
}

export type ConditionCompiler = Compiler<ConditionItem | Condition, Query>;

export declare function condition(): ConditionBuilder_;

// === Columns ===

export interface ColumnsNode {
  columns: string[];
}

export interface ColumnsBuilder {
  add(...names: string[]): ColumnsBuilder;
  build(): ColumnsNode;
}

export type ColumnsCompiler = Compiler<ColumnsNode>;

export declare function columns(): ColumnsBuilder;

// === Order By ===

export type OrderByDirection = "ASC" | "DESC";

export interface OrderByItem {
  column: string;
  direction: OrderByDirection;
}

export interface OrderBy {
  items: OrderByItem[];
}

export interface OrderByBuilder_ {
  asc(column: string): OrderByBuilder_;
  desc(column: string): OrderByBuilder_;
  build(): OrderBy;
}

export type OrderByCompiler = Compiler<OrderBy>;

export declare function orderBy(): OrderByBuilder_;

// === Limit ===

export interface Limit {
  value: number;
}

export interface LimitBuilder_ {
  build(): Limit;
}

export type LimitCompiler = Compiler<Limit, Query>;

export declare function limit(value: number): LimitBuilder_;

// === Offset ===

export interface Offset {
  value: number;
}

export interface OffsetBuilder_ {
  build(): Offset;
}

export type OffsetCompiler = Compiler<Offset, Query>;

export declare function offset(value: number): OffsetBuilder_;

// === Where ===

export interface WhereBuilder {
  build(): Query;
}

export type WhereCompiler = Compiler<ConditionItem | Condition, Query>;

export declare function where(input: ConditionItem | Condition): WhereBuilder;

// === Select ===

export interface SelectNode {
  type: "select";
  table: string;
  columns: ColumnsNode;
  where?: ConditionItem | Condition;
  orderBy?: OrderBy;
  limit?: Limit;
  offset?: Offset;
}

export interface SelectBuilder {
  columns(...cols: string[]): SelectBuilder;
  where(condition: ConditionItem | Condition): SelectBuilder;
  asc(column: string): SelectBuilder;
  desc(column: string): SelectBuilder;
  limit(value: number): SelectBuilder;
  offset(value: number): SelectBuilder;
  build(): Query;
}

export type Select = (table: string) => SelectBuilder;

// === Insert ===

export interface InsertBuilder {
  set(key: string, value: unknown): InsertBuilder;
  build(): Query;
}

export type Insert = (table: string) => InsertBuilder;

// === Update ===

export interface UpdateBuilder {
  set(key: string, value: unknown): UpdateBuilder;
  where(condition: ConditionItem | Condition): UpdateBuilder;
  build(): Query;
}

export type Update = (table: string) => UpdateBuilder;

// === Remove ===

export interface RemoveBuilder {
  where(condition: ConditionItem | Condition): RemoveBuilder;
  build(): Query;
}

export type Remove = (table: string) => RemoveBuilder;

// === Data Type ===

export type DataType =
  | "uuid"
  | "text"
  | "integer"
  | "smallint"
  | "bigint"
  | "boolean"
  | "timestamp"
  | "date"
  | "time"
  | "json"
  | "float"
  | "double"
  | "decimal"
  | "numeric"
  | "char"
  | "varchar"
  | "blob"
  | "clob"
  | "serial";

export declare enum DATA_TYPE {
  UUID = "uuid",
  TEXT = "text",
  INTEGER = "integer",
  SMALLINT = "smallint",
  BIGINT = "bigint",
  BOOLEAN = "boolean",
  TIMESTAMP = "timestamp",
  DATE = "date",
  TIME = "time",
  JSON = "json",
  FLOAT = "float",
  DOUBLE = "double",
  DECIMAL = "decimal",
  NUMERIC = "numeric",
  CHAR = "char",
  VARCHAR = "varchar",
  BLOB = "blob",
  CLOB = "clob",
  SERIAL = "serial",
}

export interface ParameterizedDataType {
  name: DataType;
  params: number[];
}

export type ColumnType = (type: ParameterizedDataType) => string;

export type DataTypeBuilder = (
  name: DataType,
  ...params: number[]
) => ParameterizedDataType;

// === Constraints ===

export declare const PRIMARY_KEY_TYPE = "primaryKey";
export declare const NOT_NULL_TYPE = "notNull";
export declare const UNIQUE_TYPE = "unique";
export declare const DEFAULT_TYPE = "default";
export declare const REFERENCES_TYPE = "references";

export interface PrimaryKey {
  type: typeof PRIMARY_KEY_TYPE;
}

export interface NotNull {
  type: typeof NOT_NULL_TYPE;
}

export interface Unique {
  type: typeof UNIQUE_TYPE;
}

export interface Default {
  type: typeof DEFAULT_TYPE;
  value: string;
}

export interface References {
  type: typeof REFERENCES_TYPE;
  table: string;
  column: string;
}

export type Constraint =
  | PrimaryKey
  | NotNull
  | Unique
  | Default
  | References;

export type PrimaryKeyCompiler = Compiler<PrimaryKey>;
export type NotNullCompiler = Compiler<NotNull>;
export type UniqueCompiler = Compiler<Unique>;
export type DefaultCompiler = Compiler<Default>;
export type ReferencesCompiler = Compiler<References>;

export type ConstraintCompiler = Compiler<Constraint>;

// === Column Definition ===

export interface ColumnDefinition {
  name: string;
  type: ParameterizedDataType;
  constraints?: Constraint[];
}

export interface ColumnDefinitionBuilder {
  primaryKey(): ColumnDefinitionBuilder;
  notNull(): ColumnDefinitionBuilder;
  unique(): ColumnDefinitionBuilder;
  default(value: string): ColumnDefinitionBuilder;
  references(table: string, column: string): ColumnDefinitionBuilder;
  build(): ColumnDefinition;
}

export type ColumnDefinitionCompiler = Compiler<ColumnDefinition>;

export declare function columnDef(
  name: string,
  type: DataType,
  ...params: number[]
): ColumnDefinitionBuilder;

// === Create Table ===

export interface CreateTableBuilder {
  ifNotExists(): CreateTableBuilder;
  column(name: string, type: DataType, ...params: number[]): CreateTableBuilder;
  primaryKey(): CreateTableBuilder;
  notNull(): CreateTableBuilder;
  unique(): CreateTableBuilder;
  default(value: string): CreateTableBuilder;
  references(table: string, column: string): CreateTableBuilder;
  build(): Query;
}

export type CreateTable = (table: string) => CreateTableBuilder;

// === Alter Table ===

export type AlterAction =
  | { type: "addColumn"; column: ColumnDefinition }
  | { type: "dropColumn"; name: string }
  | { type: "renameColumn"; from: string; to: string };

export interface AlterTableBuilder {
  addColumn(column: ColumnDefinition): AlterTableBuilder;
  dropColumn(name: string): AlterTableBuilder;
  renameColumn(from: string, to: string): AlterTableBuilder;
  build(): Query;
}

export type AlterTable = (table: string) => AlterTableBuilder;

// === Drop Table ===

export interface DropTableBuilder {
  ifExists(): DropTableBuilder;
  build(): Query;
}

export type DropTable = (table: string) => DropTableBuilder;

// === Query Builder ===

export interface QueryBuilder {
  select: Select;
  insert: Insert;
  update: Update;
  remove: Remove;
  createTable: CreateTable;
  alterTable: AlterTable;
  dropTable: DropTable;
}

export declare function queryBuilder(): QueryBuilder;
