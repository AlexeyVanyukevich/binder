/**
 * @template T
 * @typedef {import('.').Ok<T>} Ok
 */

/**
 * @typedef {import('.').Err} Err
 */

/**
 * @template T
 * @typedef {import('.').Result<T>} Result
 */

/**
 * Creates a successful result.
 * @template T
 * @param {T} value
 * @returns {Ok<T>}
 */
const ok = (value) => ({
  ok: true,
  value,
  map: (fn) => ok(fn(value)),
  flatMap: (fn) => fn(value),
  unwrap: () => value,
  unwrapOr: () => value,
  match: (cases) => cases.ok(value),
});

/**
 * Creates a failed result.
 * @param {string | Error} error
 * @returns {Err}
 */
const err = (error) => {
  const e = typeof error === 'string' ? new Error(error) : error;

  /** @type {Err} */
  const self = {
    ok: false,
    error: e,
    map: () => self,
    flatMap: () => self,
    unwrap: () => { throw e; },
    unwrapOr: (fallback) => fallback,
    match: (cases) => cases.err(e),
  };

  return self;
};

/**
 * Wraps a synchronous function call in a Result.
 * @template T
 * @param {() => T} fn
 * @returns {Result<T>}
 */
const from = (fn) => {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Wraps an async function call in a Result.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<Result<T>>}
 */
const fromAsync = async (fn) => {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

module.exports = { ok, err, from, fromAsync };
