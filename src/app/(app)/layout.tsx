import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);
  return (
    <>
      <Nav
        user={{
          displayName: user.displayName,
          role: user.role,
          isOwner: user.isOwner,
        }}
        shop={{ name: settings.shopName, logoUrl: settings.logoUrl }}
      />
      <main className="app-main">{children}</main>
    </>
  );
}
