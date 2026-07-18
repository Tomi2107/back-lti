/**
 * build.mjs — Compila los módulos AMD del plugin para Moodle.
 *
 * Uso:
 *   npm install
 *   npm run build
 *
 * Alternativa con Moodle grunt (desde la raíz de Moodle):
 *   grunt amd --root=local/accessibility
 *
 * Este script toma los archivos ES6 de amd/src/, los convierte a
 * AMD define() y los minimiza en amd/build/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { minify } from 'terser'
import { fileURLToPath } from 'url' // <-- 1. Importamos esta función necesaria

// <-- 2. Convertimos de forma segura las URLs de archivo a rutas nativas de tu sistema
const SRC  = fileURLToPath(new URL('./amd/src', import.meta.url))
const DEST = fileURLToPath(new URL('./amd/build', import.meta.url))

mkdirSync(DEST, { recursive: true })

const files = ['bridge.js']

for (const file of files) {
  const src  = readFileSync(join(SRC, file), 'utf-8')

  // Envolver en define() de AMD: reemplaza los exports ES6 con return{}
  // Para un módulo simple como bridge.js que exporta solo `init`
  const amd = src
    .replace(/^export const (\w+)/gm, 'const $1')
    .replace(/^export function (\w+)/gm, 'function $1')

  // Extraer nombres exportados del original
  const exportNames = [...src.matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1])
  const returnObj = `return {${exportNames.map(n => `${n}:${n}`).join(',')}};`

  const wrapped = `define([],function(){"use strict";\n${amd}\n${returnObj}\n});`

  const result = await minify(wrapped, {
    compress: true,
    mangle: false,
    format: { comments: false },
    sourceMap: {
      filename: file,
      url: `${basename(file, '.js')}.min.js.map`,
    },
  })

  const outFile = join(DEST, basename(file, '.js') + '.min.js')
  writeFileSync(outFile, result.code)
  if (result.map) {
    writeFileSync(outFile + '.map', result.map)
  }

  console.log(`[build] ${file} → ${basename(outFile)} (${result.code.length} bytes)`)
}

console.log('[build] AMD compilation complete.')
