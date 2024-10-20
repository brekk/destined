import { join, normalize } from 'node:path'
import { curry } from 'ramda'

// relativePathJoin :: String -> String -> String
export const relativePathJoin = curry(function _relativePathJoin(pwd, x) {
  // TODO: this should ostensibly be the province of a type system to ensure this safety
  if (typeof pwd !== 'string' || typeof x !== 'string') {
    throw new Error(`Cannot normalize bad paths, given (${pwd}, ${x}).`)
  }
  return join(pwd, normalize(x))
})
