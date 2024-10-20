const sd = (script, description = ``) =>
  description ? { script, description } : { script }

const INPUT = `./destined.js`
module.exports = {
  scripts: {
    clean: sd(`rm -r dist`, `clean the build!`),
    lint: sd(`eslint --fix .`, `lint!`),
    test: {
      ...sd(`vitest --run --disable-console-intercept`, `test!`),
      ci: sd(`vitest --run`, `test for CI!`),
      watch: sd(`vitest --disable-console-intercept`, `test with watch-mode!`),
      snapshot: sd(
        `vitest -u --run --disable-console-intercept`,
        `update snapshots`,
      ),
    },
    meta: {
      graph: `madge ${INPUT} --image graph.svg`,
    },
    care: [
      "nps -c ./package-scripts.cjs lint",
      "nps -c ./package-scripts.cjs test",
      "nps -c ./package-scripts.cjs meta.graph",
    ].join(" && "),
  },
}
