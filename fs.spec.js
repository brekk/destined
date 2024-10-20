import path from "node:path"
import { cwd } from "node:process"
import { fork } from "fluture"
import U from "unusual"
import { afterAll, test, expect } from "vitest"
import {
  localize,
  DEFAULT_REMOVAL_CONFIG,
  removeFilesWithConfig,
  mkdirp,
  readFile,
  readDirWithConfig,
  rimraf,
  writeFile,
  writeFileWithAutoPath,
} from "./fs.js"
import PKG from "./package.json"

const u = U(PKG.name + `@` + PKG.version)
test(`localize`, () => {
  expect(localize(`rawr`)).toEqual(`./rawr`)
})

test(`writeFile`, () =>
  new Promise((done) => {
    const input = `` + u.integer({ min: 0, max: 1e6 })
    fork(done)((z) => {
      expect(z).toEqual(input)
      done()
    })(
      writeFile(
        path.resolve(cwd(), `fixture/apps/admin-pretend/fakefile.biz`),
        input,
      ),
    )
  }))

test(`writeFile - fail`, () =>
  new Promise((done) => {
    fork((z) => {
      expect(z).toBeTruthy()
      expect(z.toString().includes(`ENOENT`)).toBeTruthy()
      done()
    })(done)(
      writeFile(
        path.resolve(cwd(), `invalid-path/apps/admin-pretend/fakefile.biz`),
        `fixture`,
      ),
    )
  }))

test(`writeFile - fail differently`, () =>
  new Promise((done) => {
    fork((z) => {
      expect(z).toBeTruthy()
      expect(z.toString().includes(`EBADF`)).toBeTruthy()
      done()
    })(done)(writeFile(100, `fixture`))
  }))

test(`readDirWithConfig`, () =>
  new Promise((done) => {
    fork(done)((x) => {
      expect(x.sort()).toEqual([
        `fixture/apps`,
        `fixture/apps/admin-pretend`,
        `fixture/apps/admin-pretend/fakefile.biz`,
        `fixture/apps/docs-pretend`,
        `fixture/apps/docs-pretend/fakefile.biz`,
        `fixture/packages`,
        `fixture/packages/eslint-pretend`,
        `fixture/packages/eslint-pretend/fakefile.biz`,
        `fixture/packages/ui-pretend`,
        `fixture/packages/ui-pretend/fakefile.biz`,
        `fixture/raw.js`,
        `fixture/scripts`,
        `fixture/scripts/cool-script`,
        `fixture/scripts/cool-script/fakefile.biz`,
        `fixture/scripts/copy-to-pretend`,
        `fixture/scripts/copy-to-pretend/fakefile.biz`,
      ])
      done()
    })(readDirWithConfig({}, `fixture/**/*`))
  }))

test(`readDirWithConfig src/*/`, () =>
  new Promise((done) => {
    fork(done)((x) => {
      expect(x.sort()).toEqual([
        `fixture/apps`,
        `fixture/packages`,
        `fixture/scripts`,
      ])
      done()
    })(readDirWithConfig({}, `fixture/*/`))
  }))

test(`readDir - fail`, () =>
  new Promise((done) => {
    fork((x) => {
      expect(x.message).toEqual(`callback provided to sync glob`)
      done()
    })(done)(readDirWithConfig({ sync: true }, `@@#()@#()@`))
  }))

test(`readFile`, () =>
  new Promise((done) => {
    fork(done)((s) => {
      const a = JSON.parse(s)
      // nuke this because it changes out of band when the release goes out
      delete a.version
      expect(JSON.stringify(a, null, 2)).toMatchSnapshot()
      done()
    })(readFile(path.resolve(cwd(), `package.json`)))
  }))

test(`readFile - fail`, () =>
  new Promise((done) => {
    fork((z) => {
      expect(z.toString().split(`,`)[0]).toEqual(
        `Error: ENOENT: no such file or directory`,
      )
      done()
    })(done)(readFile(path.resolve(cwd(), `coolfilenice.biz`)))
  }))

test(
  `mkdirp`,
  new Promise((done) => {
    fork(done)((raw) => {
      expect(raw).toBeTruthy()
      done()
    })(mkdirp(`my-dir`))
  }),
)

test(`writeFileWithAutoPath`, () =>
  new Promise((done) => {
    const FILE_PATH = `./my-dir/is/a/big/long/list/of/directories/file.biz`
    fork(done)((raw) => {
      expect(raw).toBeTruthy()
      fork(done)(() => done())(
        removeFilesWithConfig(DEFAULT_REMOVAL_CONFIG, [FILE_PATH]),
      )
    })(writeFileWithAutoPath(FILE_PATH, `cool cool content`))
  }))

test(`readFile`, () =>
  new Promise((done) => {
    fork(done)((x) => {
      expect(x).toEqual(`const raw = {
  input: \`this is a fixture\`,
}

export default raw
`)
      done()
    })(readFile(__dirname + `/fixture/raw.js`))
  }))

afterAll(
  () =>
    new Promise((done) => {
      fork(done)(() => done())(rimraf(`my-dir`))
    }),
)
