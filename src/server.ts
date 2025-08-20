import { WorkflowClient } from '@temporalio/client';
import 'dotenv/config';
import express from 'express';
import { connectDB } from './db';
import "./models/User";
import { changeEmailWorkflow, createThenFetchWorkflow, endSessionSignal, fetchUserWorkflow, getAllUsers, updateDataSignal, userSessionWorkflow } from './workflows';
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


// QUERY HANDLER 
app.post('/users/:id/session', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const handle = await client.start(userSessionWorkflow, {
      args: [userId],
      taskQueue: 'user-task-queue',
      workflowId: `wf-user-session-${userId}`,
      workflowExecutionTimeout:"1 hr"
    });
    res.json({ message: `User session workflow started for user ${userId}`, runId: handle.firstExecutionRunId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});



//QUERY
app.get('/users/:id/status', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const handle = client.getHandle(`wf-user-session-${userId}`);
    const status = await handle.query('getStatus');
    res.json({ userId, status });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/users/:id/info', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const handle = client.getHandle(`wf-user-session-${userId}`);
    const user = await handle.query('getUserInfo');
    res.json({ user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

//SIGNAL TO END SESSION
app.post('/users/:id/session/end', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const handle = client.getHandle(`wf-user-session-${userId}`);
    await handle.signal(endSessionSignal); 
    res.json({ message: `End signal sent for user ${userId}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

//SIGNAL
app.post('/users/create-workflow/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
      const handle = await client.start(changeEmailWorkflow, {
      args: [userId],
      taskQueue: 'user-task-queue',
      workflowId: `wf-user-signal-${userId}`,
      workflowExecutionTimeout:"1 hr"
    });
    res.json({ message: `User workflow for signal start for userid ${userId}`, runId: handle.firstExecutionRunId });

  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/users/create-signal/:id', async (req, res) => {
   try {
    const signalData = {
      action:"updateEmail",
      email:req.body.email
    }
    const userId = Number(req.params.id);
    const handle = client.getHandle(`wf-user-signal-${userId}`);
    await handle.signal(updateDataSignal,signalData); 
    res.json({ message: `create signal sent for user ${userId}` });
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
