/**
 * Compile-only syntax gate: parses every ESM module under src/ without
 * executing any of it. Run via `npm run check`
 * (node --experimental-vm-modules scripts/syntax-check.js).
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) yield full;
  }
}

if (typeof vm.SourceTextModule !== 'function') {
  console.error('Run with: node --experimental-vm-modules scripts/syntax-check.js');
  process.exit(2);
}

let failures = 0;
let checked = 0;
for (const file of [...walk(path.join(root, 'src')), path.join(root, 'scripts', 'syntax-check.js')]) {
  checked += 1;
  try {
    // Constructing a SourceTextModule parses/compiles without evaluating.
    void new vm.SourceTextModule(readFileSync(file, 'utf8'), { identifier: file });
  } catch (error) {
    failures += 1;
    console.error(`✗ ${path.relative(root, file)}\n  ${error.message}`);
  }
}

console.log(`${checked - failures}/${checked} modules parse cleanly.`);
process.exit(failures ? 1 : 0);
