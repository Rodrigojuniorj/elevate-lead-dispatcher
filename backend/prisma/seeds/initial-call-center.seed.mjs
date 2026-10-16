const initialCallCenters = [
  { name: 'Call Center A', code: 'CALL-CENTER-A', weight: 50 },
  { name: 'Call Center B', code: 'CALL-CENTER-B', weight: 30 },
  { name: 'Call Center C', code: 'CALL-CENTER-C', weight: 20 },
];

export async function seedInitialCallCenter(prisma) {
  await prisma.$transaction(
    initialCallCenters.map((callCenter) =>
      {
        const { weight: _weight, ...callCenterData } = callCenter;
        return prisma.callCenter.upsert({
        where: { code: callCenterData.code },
        update: {
          name: callCenterData.name,
          isActive: true,
        },
        create: callCenterData,
        });
      },
    ),
  );

  await prisma.$transaction(async (transaction) => {
    for (const callCenter of initialCallCenters) {
      const savedCallCenter = await transaction.callCenter.findUniqueOrThrow({
        where: { code: callCenter.code },
        select: { id: true },
      });

      await transaction.callCenterDispatchConfig.upsert({
        where: { callCenterId: savedCallCenter.id },
        update: { weight: callCenter.weight, isEnabled: true },
        create: { callCenterId: savedCallCenter.id, weight: callCenter.weight, isEnabled: true },
      });
    }
  });
}
