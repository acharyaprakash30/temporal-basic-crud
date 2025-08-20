import { proxyActivities, sleep } from '@temporalio/workflow';
import * as activities from './activities.js';

const {  createUser } = proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
});

const { getUserById } = proxyActivities<typeof activities>({
    startToCloseTimeout:"1 minute",
    retry: {
        maximumAttempts: 2,
        initialInterval: '2s',
        backoffCoefficient: 2,
    },
})

const { getUser } = proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
    scheduleToCloseTimeout: '5 minutes',
    scheduleToStartTimeout: '30 seconds',
    heartbeatTimeout: '20 seconds',
    retry: {
        maximumAttempts: 3,
        initialInterval: '2s',
        backoffCoefficient: 2,
    },
})

export async function fetchUserWorkflow(userId: number): Promise<any> {
    await sleep(500);
    return await getUserById(userId);
}

export async function createThenFetchWorkflow(input: { name: string; email: string }): Promise<any> {
    const created = await createUser(input.name, input.email);
    await sleep(300);
    const fetched = await getUserById(created.id as number);
    return { created, fetched };
}

export async function getAllUsers(): Promise<any> {
    const fetched = await getUser();
    await sleep(300);
    return { fetched };
}
