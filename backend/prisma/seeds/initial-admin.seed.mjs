import argon2 from 'argon2';
import { UserRole } from '@prisma/client';

const initialAdmin = {
  name: 'Elevate Administrator',
  email: 'admin@elevate.local',
  password: 'ElevateAdmin!2026',
};

export async function seedInitialAdmin(prisma) {
  const email = initialAdmin.email.trim().toLowerCase();
  const passwordHash = await argon2.hash(initialAdmin.password, { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email },
    update: {
      name: initialAdmin.name.trim(),
      passwordHash,
      role: UserRole.ADMIN,
      callCenterId: null,
      isActive: true,
    },
    create: {
      name: initialAdmin.name.trim(),
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
}
