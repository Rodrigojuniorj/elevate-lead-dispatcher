const initialCallCenters = [
  { name: 'Call Center A', code: 'CALL-CENTER-A' },
  { name: 'Call Center B', code: 'CALL-CENTER-B' },
  { name: 'Call Center C', code: 'CALL-CENTER-C' },
];

export async function seedInitialCallCenter(prisma) {
  await prisma.$transaction(
    initialCallCenters.map((callCenter) =>
      prisma.callCenter.upsert({
        where: { code: callCenter.code },
        update: {
          name: callCenter.name,
          isActive: true,
        },
        create: callCenter,
      }),
    ),
  );
}
