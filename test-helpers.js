import { pipe, split, slice, join } from 'ramda'

export const localsOnly = pipe(split('/'), slice(-3, Infinity), join('/'))
