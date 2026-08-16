import { prisma } from './prisma';

export async function enqueueBotAction(type: string, payload: Record<string, unknown> = {}) {
  await prisma.botAction.create({
    data: { type, payload: JSON.stringify(payload) },
  });
}

export async function enqueueLeaderboardUpdate(channelId?: string) {
  await enqueueBotAction('UPDATE_LEADERBOARD_EMBED', channelId ? { channelId } : {});
}

export async function enqueueAddSpend(userId: string, username: string, amount: number) {
  await enqueueBotAction('ADD_SPEND', { userId, username, amount });
}

export async function enqueueRemoveSpend(userId: string, amount: number) {
  await enqueueBotAction('REMOVE_SPEND', { userId, amount });
}

export async function enqueueSyncBoosters() {
  await enqueueBotAction('SYNC_BOOSTERS');
}

export async function enqueueSyncRoles() {
  await enqueueBotAction('SYNC_ROLES');
}