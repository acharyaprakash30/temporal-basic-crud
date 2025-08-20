import { WorkflowClient } from '@temporalio/client';
import 'dotenv/config';
import express from 'express';
import { connectDB } from './db';
import "./models/User";
import { createThenFetchWorkflow, fetchUserWorkflow,getAllUsers } from './workflows';
const app = express();
app.use(express.json());

let client: WorkflowClient;

app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const handle = await client.start(createThenFetchWorkflow, {
      args: [{ name, email }],
      taskQueue: 'user-task-queue',
      workflowId: `wf-create-${Date.now()}`,
    });
    const result = await handle.result();
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/users', async (req, res) => {
  try {
    const handle = await client.start(getAllUsers, {
      taskQueue: 'user-task-queue',
      workflowId: `wf-create-${Date.now()}`,
    });
    const result = await handle.result();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const handle = await client.start(fetchUserWorkflow, {
      args: [userId],
      taskQueue: 'user-task-queue',
      workflowId: `wf-fetch-${Date.now()}`,
    });
    const result = await handle.result();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

(async () => {
  try {
    await connectDB();

    const connection = await (await import('@temporalio/client')).Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });
    client = new WorkflowClient({ connection });

    app.listen(3000, () => console.log('🚀 API on http://localhost:3000'));
  } catch (e) {
    console.error('Startup error:', e);
    process.exit(1);
  }
})();
