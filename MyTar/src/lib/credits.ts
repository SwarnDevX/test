import { prisma } from '@/lib/prisma';

export class InsufficientCreditsError extends Error {
  constructor() {
    super('Insufficient credits');
    this.name = 'InsufficientCreditsError';
  }
}

export async function deductCredits(userId: string, amount: number): Promise<void> {
  const result = await prisma.$executeRaw`
    UPDATE "User"
    SET "creditBalance" = "creditBalance" - ${amount}
    WHERE id = ${userId} AND "creditBalance" >= ${amount}
  `;

  if (result === 0) {
    throw new InsufficientCreditsError();
  }
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { creditBalance: { increment: amount } },
  });
}

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user?.creditBalance ?? 0;
}

export async function checkCredits(userId: string, required: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance >= required;
}

