import { test, expect } from "vitest"
import { relativePathJoin } from "./path.js"

test(`relativePathJoin`, () => {
  expect(relativePathJoin(__dirname, `fixture`).split(`/`).slice(-2)).toEqual([
    `destined`,
    `fixture`,
  ])
})

test(`relativePathJoin - fails`, () => {
  expect(() => relativePathJoin(2, 2)).toThrow(
    `Cannot normalize bad paths, given (2, 2).`,
  )
})
