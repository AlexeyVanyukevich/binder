# Bendlab — Project Instructions

## File Structure

- `.js` files can be named freely — no requirement for `index.js`. Name files by what they do.
- Don't wrap a single file in a folder. Use `thing.js`, not `thing/index.js`. Only use folders when a module has multiple files.
- Split code as much as possible: one concept per file/folder. Prefer many small focused modules over large files.
- Type declarations (`.d.ts`) live at **logical boundary** level only.
  - One `index.d.ts` per major module (e.g., `query-builder/index.d.ts`, `store/index.d.ts`), covering all submodules within.
  - No per-file `.d.ts` — internal modules are plain `.js` without type declarations.
  - Use `/** @type {import('../index').SomeType} */` in code where inline IDE resolution is needed.

## Code Style

- Pure Node.js — no frameworks, no TypeScript compiler. Types are hand-written `.d.ts` files.
- Zero or minimal external dependencies. Wrap any external dependency in `src/lib/`.
- CommonJS (`module.exports` / `require`).
- Keep functions small and focused. If a function does two things, split it into two.

## Architecture

- `src/lib/` — reusable library code (http, config, query-builder, etc.). All external deps encapsulated here.
- `src/store/` — data access layer with multiple backends (in-memory, json, database).
- `src/app/` — application layer (API routes, workflows).
- `src/schema/` — validation schemas.
- `src/result/` — result type utility.

## When Adding New Code

1. Create the module as a `.js` file or folder — name it descriptively.
2. Add types to the nearest boundary-level `index.d.ts` (or create one if this is a new logical boundary).
3. If the module grows, split into subfiles/subfolders.
4. Keep the base/generic module untouched — extend via wrappers (e.g., PG dialect wraps base query builder).
