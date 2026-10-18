import argon2 from 'argon2';
import { UserRole } from '@prisma/client';

const initialOperators = [
  {
    name: 'Call Center A Operator',
    email: 'operator.a@elevate.local',
    password: 'OperatorA!2026',
    callCenterCode: 'CALL-CENTER-A',
  },
  {
    name: 'Call Center B Operator',
    email: 'operator.b@elevate.local',
    password: 'OperatorB!2026',
    callCenterCode: 'CALL-CENTER-B',
  },
  {
    name: 'Call Center C Operator',
    email: 'operator.c@elevate.local',
    password: 'OperatorC!2026',
    callCenterCode: 'CALL-CENTER-C',
  },
];

export async function seedInitialOperators(prisma) {
  await prisma.$transaction(async (transaction) => {
    for (const operator of initialOperators) {
      const callCenter = await transaction.callCenter.findUniqueOrThrow({
        where: { code: operator.callCenterCode },
        select: { id: true },
      });
      const email = operator.email.trim().toLowerCase();
      const passwordHash = await argon2.hash(operator.password, { type: argon2.argon2id });

      await transaction.user.upsert({
        where: { email },
        update: {
          name: operator.name.trim(),
          passwordHash,
          role: UserRole.OPERATOR,
          callCenterId: callCenter.id,
          isActive: true,
        },
        create: {
          name: operator.name.trim(),
          email,
          passwordHash,
          role: UserRole.OPERATOR,
          callCenterId: callCenter.id,
        },
      });
    }
  });
}
