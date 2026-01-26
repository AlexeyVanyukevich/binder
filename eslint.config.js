"use strict";

const js = require("@eslint/js");
const configPrettier = require("eslint-config-prettier");
const pluginPrettier = require("eslint-plugin-prettier");
const tseslint = require("typescript-eslint");
const { defineConfig } = require("eslint/config");
const globals = require("globals");
const rules = require('./eslint-rules');


/** @type {import('eslint').Linter.Config} */
const defaultConfig = {
  plugins: {
    prettier: pluginPrettier,
  },
  ignores: ["node_modules/**", "dist/**", "build/**"],
  rules: configPrettier.rules,
};

/** @type {import('eslint').Linter.Config} */
const jsConfig = {
  files: ["**/*.{js,mjs,cjs}"],
  languageOptions: {
    sourceType: "commonjs",
    globals: globals.node,
  },
  rules: js.configs.recommended.rules,
};

const rulesConfigs = rules();

for (const rulesConfig of rulesConfigs) {
  Object.assign(jsConfig.rules, rulesConfig);
}

/** @type {import('eslint').Linter.Config} */
const tsConfig = {
  files: ["**/*.ts"],
  extends: [...tseslint.configs.recommended],
  languageOptions: {
    sourceType: "module",
  }
};

module.exports = defineConfig([
  defaultConfig,
  jsConfig,
  tsConfig
]);
