import 'dotenv/config';
import { Connection, WorkflowClient } from '@temporalio/client';
import { fetchUserWorkflow, createThenFetchWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const client = new WorkflowClient({ connection });

  const handleA = await client.start(createThenFetchWorkflow, {
    args: [{ name: 'Alice', email: `alice_${Date.now()}@example.com` }],
    taskQueue: 'user-task-queue',
    workflowId: `wf-create-then-fetch-${Date.now()}`,
  });

  console.log('Started workflow A:', handleA.workflowId);
  console.log('Result A:', await handleA.result());

  const handleB = await client.start(fetchUserWorkflow, {
    args: [12],
    taskQueue: 'user-task-queue',
    workflowId: `wf-fetch-${Date.now()}`,
  });

  console.log('Started workflow B:', handleB.workflowId);
  console.log('Result B:', await handleB.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
