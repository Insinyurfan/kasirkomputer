import { SettingsForm } from "@/components/SettingsForm";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Pengaturan — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireUser();
  const { error, ok } = await searchParams;
  const settings = await getSettings();
  return (
    <>
      <h1 className="page-title">Pengaturan Toko</h1>
      <SettingsForm settings={settings} error={error} saved={ok === "1"} />
    </>
  );
}
