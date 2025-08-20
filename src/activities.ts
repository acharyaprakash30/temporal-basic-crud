import { ApplicationFailure } from '@temporalio/client';
import { User } from './models/User';

export async function getUserById(id: number) {
  const user = await User.findByPk(id);
  if (!user) {
        throw ApplicationFailure.nonRetryable(
          `User with id ${id} not found`,
         'NotFoundError'
    );
  }
  return user.toJSON();
}

export async function createUser(name: string, email: string) {
  const user = await User.create({ name, email });
  return user.toJSON();
}


export async function getUser() {
  const user = await User.findAll();
  return user
}


export async function processUserData(userId: number, email: string) {
    const user = await User.findByPk(userId);
    if (user) {
       await user.update({ email });
    }
    return user?.toJSON();
  }