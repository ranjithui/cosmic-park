const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // --- Admin user ---
  // Set ADMIN_PASSWORD to control the login (in Render: the API service's
  // env vars). When it is set, every deploy resets the password to it —
  // that is the only way to rotate the password on an instance with no
  // shell. When it is unset, an existing password is left alone and only
  // a brand-new database falls back to the throwaway default.
  const explicitPassword = process.env.ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(explicitPassword || 'ChangeMe123!', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@cosmicpark.in' },
    update: explicitPassword ? { passwordHash } : {},
    create: {
      email: 'admin@cosmicpark.in',
      passwordHash,
      name: 'Cosmic Park Admin',
      role: 'owner',
    },
  });

  // --- Room type: the whole 8BR villa ---
  const villa = await prisma.roomType.upsert({
    where: { slug: 'whole-villa-8br' },
    update: {},
    create: {
      name: 'Whole Villa (8 Bedroom)',
      slug: 'whole-villa-8br',
      description:
        'The entire Cosmic Park villa — 8 bedrooms, private pool, expansive lawn, and forest views. Booked as a single unit.',
      maxOccupancy: 16,
      bedrooms: 8,
      bathrooms: 8,
      basePrice: 45000,
    },
  });

  await prisma.room.upsert({
    where: { roomTypeId_code: { roomTypeId: villa.id, code: 'VILLA-01' } },
    update: {},
    create: { roomTypeId: villa.id, code: 'VILLA-01' },
  });

  // --- Amenities ---
  const amenityNames = [
    'Private Swimming Pool',
    'Expansive Lawn',
    'Al Fresco Dining',
    'Bonfire Pit',
    'Badminton Court',
    'Football Ground',
    'Carrom',
    'Bathtub',
  ];
  for (const name of amenityNames) {
    const amenity = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.roomTypeAmenity.upsert({
      where: { roomTypeId_amenityId: { roomTypeId: villa.id, amenityId: amenity.id } },
      update: {},
      create: { roomTypeId: villa.id, amenityId: amenity.id },
    });
  }

  // --- Seasonal rate plans ---
  // RatePlan has no unique constraint (only @@index), so createMany's
  // skipDuplicates can't fire and re-running would stack duplicate plans.
  // Match on (roomTypeId, name) by hand to keep the seed re-runnable —
  // the deploy pipeline runs it on every build.
  const year = new Date().getFullYear();
  const ratePlans = [
    {
      name: 'Off-Peak',
      startDate: new Date(`${year}-01-10`),
      endDate: new Date(`${year}-03-01`),
      nightlyRate: 38000,
      priority: 1,
    },
    {
      name: 'Peak Season',
      startDate: new Date(`${year}-04-01`),
      endDate: new Date(`${year}-06-15`),
      nightlyRate: 52000,
      priority: 2,
    },
    {
      name: 'Festive / New Year',
      startDate: new Date(`${year}-12-20`),
      endDate: new Date(`${year + 1}-01-05`),
      nightlyRate: 68000,
      minStay: 2,
      priority: 3,
    },
  ];
  for (const plan of ratePlans) {
    const existing = await prisma.ratePlan.findFirst({
      where: { roomTypeId: villa.id, name: plan.name },
      select: { id: true },
    });
    if (existing) {
      // Refresh the dates so a demo seeded last year still quotes correctly.
      await prisma.ratePlan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.ratePlan.create({ data: { roomTypeId: villa.id, ...plan } });
    }
  }

  // --- Add-on catalog ---
  await prisma.addOnCatalog.upsert({
    where: { name: 'Bonfire Experience' },
    update: {},
    create: {
      name: 'Bonfire Experience',
      description: 'Evening bonfire setup with seating, arranged on the lawn.',
      unit: 'per_person',
      price: 1000,
      taxRate: 18,
    },
  });

  console.log('Seed complete.');
  console.log(
    explicitPassword
      ? 'Admin login: admin@cosmicpark.in / password from ADMIN_PASSWORD'
      : 'Admin login: admin@cosmicpark.in / ChangeMe123!  (set ADMIN_PASSWORD to change it)'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
