/**
 * ts_require.js: lets plain node `require()` a .ts file, so a Netlify function
 * that imports dashboard source (mcp-server.js requires
 * src/lib/aiVisibilityScore.ts and src/lib/competitorFilter.ts, bundled by
 * esbuild in production) can be loaded by the test suites.
 *
 * Uses typescript.transpileModule, the devDependency competitor_aggregate.test.js
 * already uses. Types are erased, nothing is type-checked: `npm run build`
 * (tsc) remains the type gate. Registering '.ts' also makes node's resolver try
 * the .ts extension for extensionless relative imports inside those files.
 *
 * Usage: require('./helpers/ts_require') before requiring the function.
 */
const fs = require('fs')
const Module = require('module')
const ts = require('typescript')

function compileTs(module, filename) {
  const src = fs.readFileSync(filename, 'utf8')
  const out = ts.transpileModule(src, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  module._compile(out, filename)
}

// Always ours: newer node versions may register their own .ts handler
// (type stripping), which would load these ESM-syntax files differently.
Module._extensions['.ts'] = compileTs

/** Load a .ts file fresh, bypassing the require cache (used by the plan-agreement check). */
function requireTsFresh(filename) {
  const m = new Module(filename, module)
  m.filename = filename
  m.paths = Module._nodeModulePaths(require('path').dirname(filename))
  compileTs(m, filename)
  return m.exports
}

module.exports = { compileTs, requireTsFresh }
