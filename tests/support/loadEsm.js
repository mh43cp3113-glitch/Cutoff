// Loads an ES-module source file (the `export function` syntax used under
// src/, written for Metro/Babel) into a plain CommonJS test run, without
// adding a test-framework dependency. Transpiles just the module syntax with
// the @babel/core + @babel/plugin-transform-modules-commonjs already pulled
// in transitively by Expo, then evaluates the result as a real Module so its
// relative requires (e.g. '../data/questions.json') resolve normally.
const Module = require('module');
const babel = require('@babel/core');

function loadEsm(absolutePath) {
  const { code } = babel.transformFileSync(absolutePath, {
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    babelrc: false,
    configFile: false,
  });
  const mod = new Module(absolutePath, module);
  mod.filename = absolutePath;
  mod.paths = Module._nodeModulePaths(require('path').dirname(absolutePath));
  mod._compile(code, absolutePath);
  return mod.exports;
}

module.exports = { loadEsm };
