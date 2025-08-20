import { Worker } from '@temporalio/worker';
import { connectDB } from './db';
import * as activities from './activities';

const workflowsPath = new URL('./workflows.ts', import.meta.url).pathname;

async function run() {
  await connectDB();
  const worker = await Worker.create({
    workflowsPath,
    activities,
    taskQueue: 'user-task-queue',
  });

  console.log(' Worker started. Listening on taskQueue "user-task-queue"...');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
