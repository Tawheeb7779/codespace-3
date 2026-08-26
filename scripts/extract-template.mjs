// Dev helper: materializes DEFAULT_REACT_THREE_FILES from the project store into a
// directory so the generated template can be validated with a real npm install/build.
// Usage: node scripts/extract-template.mjs <outDir>
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { transformSync } from 'esbuild';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node scripts/extract-template.mjs <outDir>');
  process.exit(1);
}

const source = readFileSync('src/store/useProjectStore.ts', 'utf8');
const startMarker = 'export const DEFAULT_REACT_THREE_FILES';
const start = source.indexOf(startMarker);
const end = source.indexOf('\n};', start);
if (start === -1 || end === -1) {
  console.error('Could not locate DEFAULT_REACT_THREE_FILES literal.');
  process.exit(1);
}

const idsStart = source.indexOf('export const DEFAULT_ROOT_FILE_IDS');
const idsEnd = source.indexOf('\n];', idsStart);
const ids = source.slice(idsStart, idsEnd + 3).replace('export ', '');
const literal = `${ids}\n${source.slice(start, end + 3).replace(startMarker, 'const files')}`;
const { code } = transformSync(`${literal}\nexport default files;`, { loader: 'ts', format: 'cjs' });
const module = { exports: {} };
new Function('module', 'exports', code)(module, module.exports);
const files = module.exports.default;

for (const file of Object.values(files)) {
  if (file.isFolder || file.id === 'root') continue;
  const target = join(outDir, file.path.replace(/^\//, ''));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.content);
  console.log('wrote', target);
}
