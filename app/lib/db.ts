import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function savePayment(paymentId: string, userId: string, status: string) {
  await prisma.payment.upsert({
    where: { id: paymentId },
    update: { status, updatedAt: new Date() },
    create: { id: paymentId, userId, status },
  });
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status, updatedAt: new Date() },
  });
}

export async function getPayment(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
  });
}

export async function grantUserAccess(userId: string, paymentId: string) {
  await prisma.userPurchase.create({
    data: { userId, paymentId },
  });
}

export async function getUserPurchases(userId: string) {
  return prisma.userPurchase.findMany({
    where: { userId },
  });
}
