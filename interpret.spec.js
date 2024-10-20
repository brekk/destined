import { fork } from "fluture"
import { test, expect } from "vitest"
import { interpret } from "./interpret.js"

test(`interpret`, () =>
  new Promise((done) => {
    expect(interpret).toBeTruthy()
    fork(done)((x) => {
      expect(x).toEqual({ input: `this is a fixture` })
      done()
    })(interpret(`./fixture/raw.js`))
  }))
