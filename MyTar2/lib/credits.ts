import { db } from './db';
import { CREDIT_COSTS } from './types';

export type CreditAction = keyof typeof CREDIT_COSTS;

export async function checkAndDeductCredits(userId: string, action: CreditAction) {
  const cost = CREDIT_COSTS[action];

  if (cost === 0) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
    return { success: true, remainingCredits: user?.credits ?? 0 };
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
  if (!user) return { success: false, remainingCredits: 0, error: 'User not found' };

  if (user.credits < cost) {
    return {
      success: false,
      remainingCredits: user.credits,
      error: `Insufficient credits. This action costs ${cost} credit(s). You have ${user.credits}.`,
    };
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { credits: { decrement: cost } },
    select: { credits: true },
  });

  await db.creditTransaction.create({
    data: { userId, amount: -cost, type: action, description: `${action} — ${cost} credit(s)` },
  });

  return { success: true, remainingCredits: updated.credits };
}

export async function getCreditBalance(userId: string): Promise<number> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
  return user?.credits ?? 0;
}

export async function addCredits(userId: string, amount: number, description: string): Promise<number> {
  const updated = await db.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });
  await db.creditTransaction.create({ data: { userId, amount, type: 'add', description } });
  return updated.credits;
}
