import { defineQuery, defineSignal, proxyActivities, setHandler, sleep,condition, log } from '@temporalio/workflow';
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

const { processUserData } = proxyActivities<typeof activities>({
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

export const getStatusQuery = defineQuery<string>('getStatus');
export const getUserInfoQuery = defineQuery<any>('getUserInfo');
export const endSessionSignal = defineSignal('endSession');
export const updateDataSignal = defineSignal<[data: { action: string; email: string }]>("updateData");



export async function userSessionWorkflow(userId: number) {
  let status = 'Initializing';
  let user: any = null;
  let sessionEnded = false;

  setHandler(getStatusQuery, () => status);
  setHandler(getUserInfoQuery, () => user);
  setHandler(endSessionSignal, () => {
    sessionEnded = true;
  });

  status = 'Fetching from DB...';
  user = await getUserById(userId);

  if (!user) {
    status = 'User not found';
    return;
  }

  status = 'Online';
  
  while (!sessionEnded) {
    status = `Online (last checked: ${new Date().toISOString()})`;
    await Promise.race([
      condition(() => sessionEnded),
      sleep(5000)
    ]);
  }
  status = 'Offline';
  user = null;

  return { message: `User ${userId} session ended` };
}

export async function changeEmailWorkflow(userId: number) {
    let currentEmail = "";
  setHandler(updateDataSignal, async (data) => {
    if (data.action === "updateEmail") {
      currentEmail = data.email;
      log.info(`Updated email to: ${currentEmail}`);
    }
  });
  while(true){
      await condition(() => currentEmail !== "");
     await sleep(5000);
      await processUserData(userId,currentEmail);
      currentEmail = ""
   }
  }