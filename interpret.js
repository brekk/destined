import { Future } from "fluture"
import { curry, pipe } from "ramda"
function noOp() {}

const handleDefault = (rawPlug) => {
  // TODO: this must be an upstream bug
  const out = rawPlug?.default?.default
    ? rawPlug.default.default
    : rawPlug?.default
      ? rawPlug.default
      : rawPlug
  return out
}

export const interpretWithCancel = curry(
  function _interpretWithCancel(cancel, filepath) {
    return Future(function interpretF(bad, good) {
      import(filepath).catch(bad).then(pipe(handleDefault, good))
      return cancel
    })
  },
)
export const interpret = interpretWithCancel(noOp)
export const importF = interpret

export const demandWithCancel = curry(
  function _demandWithCancel(cancel, filepath) {
    return Future(function demandF(bad, good) {
      try {
        good(require(filepath))
      } catch (e) {
        bad(e)
      }
      return cancel
    })
  },
)

export const demand = demandWithCancel(noOp)
export const requireF = demand
