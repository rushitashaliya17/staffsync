import { runSeed } from './seed.js';

async function main() {
  await runSeed(true);
  console.log('[Seed CLI] Completed.');
  process.exit(0);
}

main().catch(err => {
  console.error('[Seed CLI] Failed:', err);
  process.exit(1);
});
