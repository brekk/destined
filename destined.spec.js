import { test, expect } from "vitest"
import * as DESTINED from "./destined.js"

test("destined exports", () => {
  expect(Object.keys(DESTINED)).toEqual([
    "digUpWithCancel",
    "digUp",
    "NO_OP",
    "localize",
    "readFileWithFormatAndCancel",
    "readFileWithCancel",
    "readFile",
    "readJSONFileWithCancel",
    "readJSONFile",
    "readDirWithConfigAndCancel",
    "readDirWithConfig",
    "readDir",
    "writeFileWithConfigAndCancel",
    "writeFileWithConfig",
    "writeFile",
    "removeFileWithConfigAndCancel",
    "removeFileWithConfig",
    "rm",
    "removeFile",
    "rimraf",
    "DEFAULT_REMOVAL_CONFIG",
    "removeFilesWithConfigAndCancel",
    "removeFilesWithConfig",
    "removeFiles",
    "mkdirWithCancel",
    "mkdir",
    "mkdirp",
    "access",
    "exists",
    "readable",
    "directoryOnly",
    "writeFileWithAutoPath",
    "ioWithCancel",
    "io",
    "read",
    "write",
    "findFile",
    "readAnyOr",
    "readAny",
    "requireAnyOr",
    "interpretWithCancel",
    "interpret",
    "importF",
    "demandWithCancel",
    "demand",
    "requireF",
    "relativePathJoin",
  ])
})
