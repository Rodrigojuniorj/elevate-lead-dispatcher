export async function seedInitialLeadCatalog(prisma) {
  await prisma.$transaction(async (transaction) => {
    const funnel = await transaction.funnel.upsert({
      where: { code: 'vsl-01' },
      update: { name: 'VSL 01', isActive: true },
      create: { name: 'VSL 01', code: 'vsl-01' },
    });

    const product = await transaction.product.upsert({
      where: { code: 'nutralean' },
      update: { name: 'NutraLean', isActive: true },
      create: { name: 'NutraLean', code: 'nutralean' },
    });

    await transaction.funnelProduct.upsert({
      where: { funnelId_productId: { funnelId: funnel.id, productId: product.id } },
      update: { isActive: true },
      create: { funnelId: funnel.id, productId: product.id },
    });

    await transaction.affiliate.upsert({
      where: { code: 'affiliate-999' },
      update: { name: 'Affiliate 999', isActive: true },
      create: { name: 'Affiliate 999', code: 'affiliate-999' },
    });
  });
}
