import fs from "node:fs"
import { sep } from "node:path"
import { reduce, F, propOr, without, curry, pipe, map, __ as $ } from "ramda"
import {
  encaseP,
  Future,
  chain,
  chainRej,
  isFuture,
  mapRej,
  parallel,
  race,
} from "fluture"
import { glob } from "glob"

/* eslint-disable max-len */
/**
 * @pageSummary A Future-wrapped `fs` API, for future-based, lazy, easy-to-model asynchrony that makes it easy to manipulate the file system.
 */
/* eslint-enable max-len */

const { constants } = fs

export const NO_OP = () => {}

// fs functions that use callbacks of specific arity; a helper
// const [__cb, __cb2, __cb3] = map(passFailCallbackWithArity, [1, 2, 3])

/**
 * make a file string relative
 * @name localize
 * @example
 * ```js
 * import { localize } from 'file-system'
 * console.log(`support ${localize('business')}`)
 * // support ./business
 * ```
 */
export const localize = (z) => `.${sep}${z}`

/**
 * Read a file asynchronously as a Future-wrapped value.
 * @curried
 *
 *  1. readFileWithFormatAndCancel - Can be given a file encoding and a cancellation function.
 *     @example
 *     ```js
 *     import { fork } from 'fluture'
 *     import { readFile } from 'file-system'
 *     fork(console.warn)(console.log)(
 *       readFileWithFormatAndCancel(() => process.exit(), 'utf8', './README.md')
 *     )
 *     ```
 *
 *  2. readFileWithCancel - Reads `utf8` files only.
 *     @example
 *     ```js
 *     import { fork } from 'fluture'
 *     import { readFile } from 'file-system'
 *     fork(console.warn)(console.log)(
 *       readFileWithCancel(() => process.exit(), './README.md')
 *     )
 *     ```
 *
 *  3. readFile - Eschews any custom cancellation.
 *     @example
 *     ```js
 *     import { fork } from 'fluture'
 *     import { readFile } from 'file-system'
 *     fork(console.warn)(console.log)(readFile('./README.md'))
 *     ```
 */
export const readFileWithFormatAndCancel = curry(
  function _readFileWithFormatAndCancel(cancel, format, x) {
    return Future((bad, good) => {
      fs.readFile(x, format, (err, data) => (err ? bad(err) : good(data)))
      return cancel
    })
  },
)
export const readFileWithCancel = readFileWithFormatAndCancel($, "utf8")
export const readFile = readFileWithCancel(NO_OP)

/**
 * Read a JSON file asynchronously as a Future-wrapped value, given a cancellation function
 * @name readJSONFileWithCancel
 * @see {@link readFile}
 * @see {@link readJSONFile}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { readJSONFile } from 'file-system'
 * fork(console.warn)(console.log)(readJSONFile('./package.json'))
 * ```
 */
export const readJSONFileWithCancel = curry(
  function _readJSONFileWithCancel(cancel, x) {
    return pipe(readFileWithCancel(cancel), map(JSON.parse))(x)
  },
)

/**
 * Read a JSON file asynchronously as a Future-wrapped value
 * @name readJSONFile
 * @see {@link readFile}
 * @see {@link readJSONFileWithCancel}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { readJSONFile } from 'file-system'
 * fork(console.warn)(console.log)(readJSONFile('./package.json'))
 * ```
 */
export const readJSONFile = readJSONFileWithCancel(NO_OP)

/**
 * Read a glob asynchronously as a Future-wrapped value,
 * with configuration and a cancellation function.
 * Configuration is passed to [glob](https://www.npmjs.com/package/glob)
 * @name readDirWithConfigAndCancel
 * @see {@link readDirWithConfig}
 * @see {@link readDir}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { readDirWithConfigAndCancel } from 'file-system'
 * // [...]
 * pipe(
 *   fork(console.warn)(console.log)
 * )(readDirWithConfigAndCancel(cancellationFn, { ignore: ['node_modules/**'] }, 'src/*'))
 * ```
 */
export const readDirWithConfigAndCancel = curry(
  function _readDirWithConfigAndCancel(cancel, conf, g) {
    return Future((bad, good) => {
      try {
        glob(g, conf).catch(bad).then(good)
      } catch (e) {
        bad(e)
      }
      return cancel
    })
  },
)

/**
 * Read a glob asynchronously as a Future-wrapped value, with configuration.
 * Configuration is passed to [glob](https://www.npmjs.com/package/glob)
 * @name readDirWithConfig
 * @see {@link readDirWithConfigAndCancel}
 * @see {@link readDir}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { readDirWithConfig } from 'file-system'
 * // [...]
 * pipe(
 *   fork(console.warn)(console.log)
 * )(readDirWithConfig({ ignore: ['node_modules/**'] }, 'src/*'))
 * ```
 */
export const readDirWithConfig = readDirWithConfigAndCancel(NO_OP)

/**
 * Read a glob asynchronously as a Future-wrapped value, default config assumed.
 * Configuration is passed to [glob](https://www.npmjs.com/package/glob)
 * @name readDir
 * @see {@link readDirWithConfigAndCancel}
 * @see {@link readDirWithConfig}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { readDir } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(readDir('src/*'))
 * ```
 */
export const readDir = readDirWithConfig({})

/**
 * Write to a file, with configuration and a cancellation function.
 * Unlike `fs.writeFile`, this will return the written value as a Future-wrapped value.
 * @name writeFileWithConfigAndCancel
 * @see {@link writeFileWithConfig}
 * @see {@link writeFile}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { writeFileWithConfig } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   writeFileWithConfigAndCancel(
 *     cancellationFunction,
 *     { ...fs.writeFileConfig },
 *     'my-file.txt',
 *     'hey I am a file'
 *   )
 * )
 * ```
 */
export const writeFileWithConfigAndCancel = curry(
  function _writeFileWithConfigAndCancel(cancel, conf, file, content) {
    return Future((bad, good) => {
      fs.writeFile(file, content, conf, (e) => {
        if (e) {
          bad(e)
          return
        }
        good(content)
      })
      return cancel
    })
  },
)

/**
 * Write to a file, with configuration.
 * Unlike `fs.writeFile`, this will return the written value as a Future-wrapped value.
 * @name writeFileWithConfig
 * @see {@link writeFileWithConfigAndCancel}
 * @see {@link writeFile}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { writeFileWithConfig } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   writeFileWithConfig(
 *     { encoding: 'utf8' },
 *     'my-file.txt',
 *     'hey I am a file'
 *   )
 * )
 * ```
 */
export const writeFileWithConfig = writeFileWithConfigAndCancel(NO_OP)

/**
 * Write to a file, assuming `'utf8'`.
 * Unlike `fs.writeFile`, this will return the written value as a Future-wrapped value.
 * @name writeFile
 * @see {@link writeFileWithConfigAndCancel}
 * @see {@link writeFileWithConfig}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { writeFileWithConfig } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   writeFileWithConfig(
 *     'my-file.txt',
 *     'hey I am a file'
 *   )
 * )
 * ```
 */
export const writeFile = writeFileWithConfig({ encoding: "utf8" })

/**
 * Remove a file, configurably, with cancellation.
 * Unlike `fs.rm`, this returns the path of the deleted file as a Future-wrapped string.
 * @curried
 *  1. removeFileWithConfigAndCancel - Configuration and cancellation
 *
 *     @example
 *      ```js
 *      import { fork } from 'fluture'
 *      import { removeFileWithConfigAndCancel } from 'file-system'
 *
 *      fork(console.warn)(console.log)(
 *        removeFileWithConfigAndCancel(
 *          cancellationFn,
 *          { ...fs.removeFileConfig },
 *          'my-file.txt'
 *        )
 *      )
 *      ```
 *  2. removeFileWithConfig - No config, just cancellation
 *
 *     @example
 *     ```js
 *     import { fork } from 'fluture'
 *     import { removeFileWithConfig } from 'file-system'
 *     // [...]
 *     fork(console.warn)(console.log)(
 *       removeFileWithConfig(
 *         { ...fs.removeFileConfig },
 *         'my-file.txt'
 *       )
 *     )
 *     ```
 *
 *  3. removeFile - remove a file. Aliased to `rm`.
 *
 *     @example
 *     ```js
 *     import { fork } from 'fluture'
 *     import { removeFile } from 'file-system'
 *     // [...]
 *     fork(console.warn)(console.log)(
 *       removeFile(
 *         'my-file.txt'
 *       )
 *     )
 *     ```
 *
 */
export const removeFileWithConfigAndCancel = curry(
  function _removeFileWithConfigAndCancel(cancel, options, fd) {
    return Future((bad, good) => {
      fs.rm(fd, options, (err) => (err ? bad(err) : good(fd)))
      return cancel
    })
  },
)
export const removeFileWithConfig = removeFileWithConfigAndCancel(NO_OP)
export const rm = removeFileWithConfig({})
export const removeFile = rm
export const rimraf = removeFileWithConfig({ force: true, recursive: true })

export const DEFAULT_REMOVAL_CONFIG = {
  force: false,
  maxRetries: 0,
  recursive: false,
  retryDelay: 100,
  parallel: 10,
}

/**
 * Remove multiple files, configurably, with a cancellation function.
 * @name removeFilesWithConfigAndCancel
 * @see {@link removeFilesWithConfig}
 * @see {@link removeFiles}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { removeFilesWithConfig } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   removeFilesWithConfigAndCancel(
 *     cancellationFn,
 *     { parallel: 30 },
 *     [...list, ...of, ...thirty, ...files]
 *   )
 * )
 * ```
 */
export const removeFilesWithConfigAndCancel = curry(
  function _removeFilesWithConfigAndCancel(cancel, conf, list) {
    return pipe(
      map(removeFileWithConfigAndCancel(cancel, without(["parallel"], conf))),
      parallel(propOr(10, "parallel", conf)),
    )(list)
  },
)

/**
 * Remove multiple files, configurably.
 * @name removeFilesWithConfig
 * @see {@link removeFilesWithConfigAndCancel}
 * @see {@link removeFiles}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { DEFAULT_REMOVAL_CONFIG, removeFilesWithConfig } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   removeFilesWithConfig(
 *     DEFAULT_REMOVAL_CONFIG,
 *     [...list, ...of, ...thirty, ...files]
 *   )
 * )
 * ```
 */
export const removeFilesWithConfig = removeFilesWithConfigAndCancel(NO_OP)

/**
 * Remove multiple files, configurably.
 * @name removeFilesWithConfig
 * @see {@link removeFilesWithConfigAndCancel}
 * @see {@link removeFiles}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { removeFilesWithConfig } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   removeFilesWithConfig(
 *     [...list, ...of, ...thirty, ...files]
 *   )
 * )
 * ```
 */
export const removeFiles = removeFilesWithConfig(DEFAULT_REMOVAL_CONFIG)

/**
 * Make a directory, given a cancellation function.
 * Returns a Future-wrapped file path as a discrete value upon success.
 * @name mkdirWithCancel
 * @see {@link mkdir}
 * @see {@link mkdirp}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { mkdirWithCancel } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   mkdirWithCancel(
 *     () => {},
 *     {},
 *     'my-dir'
 *   )
 * )
 * ```
 */
export const mkdirWithCancel = curry(
  function _mkdirWithCancel(cancel, conf, x) {
    return Future((bad, good) => {
      fs.mkdir(x, conf, (err) => (err ? bad(err) : good(x)))
      return cancel
    })
  },
)

/**
 * Make a directory
 * Returns a Future-wrapped file path as a discrete value upon success.
 * @name mkdir
 * @see {@link mkdirWithCancel}
 * @see {@link mkdirp}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { mkdir } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   mkdir(
 *     {},
 *     'my-dir'
 *   )
 * )
 * ```
 */
export const mkdir = mkdirWithCancel(NO_OP)

/**
 * Make a directory, recursively.
 * Returns a Future-wrapped file path as a discrete value upon success.
 * @name mkdirp
 * @see {@link mkdirWithCancel}
 * @see {@link mkdir}
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { mkdir } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   mkdir(
 *     {},
 *     'my-dir'
 *   )
 * )
 * ```
 */
export const mkdirp = mkdir({ recursive: true })

export const access = curry(function _access(permissions, filePath) {
  return Future((bad, good) => {
    fs.access(filePath, permissions, (err) => (err ? bad(err) : good(true)))
    return () => {}
  })
})

export const exists = access(constants.F_OK)
export const readable = access(constants.R_OK)

export const directoryOnly = (filePath) =>
  filePath.slice(0, filePath.lastIndexOf("/"))

/**
 * Write a file to a nested folder and automatically create needed folders, akin to `mkdir -p`
 * @name writeFileWithAutoPath
 * @example
 * ```js
 * import { fork } from 'fluture'
 * import { writeFileWithAutoPath } from 'file-system'
 * // [...]
 * fork(console.warn)(console.log)(
 *   writeFileWithAutoPath(
 *     "folders/you/must/exist/file.biz",
 *     "my cool content"
 *   )
 * )
 * ```
 */
export const writeFileWithAutoPath = curry(
  function _writeFileWithAutoPath(filePath, content) {
    return pipe(
      directoryOnly,
      (dir) =>
        pipe(
          exists,
          chainRej(() => mkdirp(dir)),
        )(dir),
      chain(() => writeFile(filePath, content)),
    )(filePath)
  },
)

export const ioWithCancel = curry(
  function _ioWithCancel(cancel, fn, fd, buffer, offset, len, position) {
    return Future((bad, good) => {
      fn(fd, buffer, offset, len, position, (e, bytes, buff) =>
        e ? bad(e) : good(bytes, buff),
      )
      return cancel
    })
  },
)

export const io = ioWithCancel(NO_OP)

export const read = io(fs.read)
export const write = io(fs.write)

export const findFile = curry(function _findFile(fn, def, x) {
  return pipe(
    map(pipe(fn, mapRej(F))),
    reduce((a, b) => (isFuture(a) ? race(a)(b) : b), def),
  )(x)
})

export const readAnyOr = curry(function _readAnyOr(def, format, x) {
  return findFile(readFile, def, x)
})

export const readAny = readAnyOr(null)

export const requireAnyOr = findFile(readable)
