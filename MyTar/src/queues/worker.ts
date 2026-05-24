import 'dotenv/config';
import { backgroundWorker } from './workers/backgroundWorker';
import { exportWorker } from './workers/exportWorker';

console.log('🚀 Workers started');
console.log('  - Background generation worker: ACTIVE');
console.log('  - Export worker: ACTIVE');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await backgroundWorker.close();
  await exportWorker.close();
  process.exit(0);
});

