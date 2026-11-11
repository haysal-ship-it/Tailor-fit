import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { unlink } from 'node:fs/promises';
const output = 'scripts/.test-invoices.mjs';
try {
  // Bundle our TS files as ESM; react-pdf's dependencies use ESM-only exports.
  await build({ entryPoints: ['scripts/test-invoices.ts'], bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: output });
  const result = spawnSync(process.execPath, [output], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  await unlink(output).catch(() => {});
}
