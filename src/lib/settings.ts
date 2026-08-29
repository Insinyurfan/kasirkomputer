import "server-only";
import { prisma } from "./prisma";
import { DEFAULT_SHOP_NAME } from "./shop";

export type ShopSettingsView = {
  shopName: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  headerNote: string | null;
  footerNote: string | null;
  startingReceiptNo: number;
};

const DEFAULTS = {
  shopName: DEFAULT_SHOP_NAME,
  logoUrl: null as string | null,
  address: "",
  phone: "",
  headerNote: null as string | null,
  footerNote: null as string | null,
  startingReceiptNo: 1000,
};

/** Always returns usable settings, creating the row 1 default if missing. */
export async function getSettings(): Promise<ShopSettingsView> {
  const row = await prisma.shopSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...DEFAULTS },
  });
  return {
    shopName: row.shopName || DEFAULT_SHOP_NAME,
    logoUrl: row.logoUrl,
    address: row.address,
    phone: row.phone,
    headerNote: row.headerNote,
    footerNote: row.footerNote,
    startingReceiptNo: row.startingReceiptNo,
  };
}
