import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Single settings row (id = 1). Idempotent: upsert leaves an existing row's
  // edited values untouched and only fills defaults when the row is missing.
  await prisma.shopSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      address: "",
      phone: "",
      headerNote: null,
      footerNote: null,
      startingReceiptNo: 1000,
    },
  });
  console.log("Seed complete: ShopSettings row ensured.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
