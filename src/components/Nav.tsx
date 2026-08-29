"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/Brand";

type NavUser = {
  displayName: string;
  role: "ADMIN" | "MEMBER";
  isOwner: boolean;
};

type NavShop = { name: string; logoUrl: string | null };

const LINKS = [
  { href: "/pos", label: "Kasir" },
  { href: "/products", label: "Produk" },
  { href: "/categories", label: "Kategori" },
  { href: "/history", label: "Riwayat" },
  { href: "/settings", label: "Pengaturan" },
];

export function Nav({ user, shop }: { user: NavUser; shop: NavShop }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [...LINKS];
  if (user.role === "ADMIN") {
    links.push({ href: "/users", label: "Pengguna" });
  }

  const roleLabel = user.isOwner ? "Owner" : user.role === "ADMIN" ? "Admin" : "Member";

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link href="/pos" className="topnav-brand">
          <BrandLogo name={shop.name} logoUrl={shop.logoUrl} size={30} className="topnav-logo" />
          <span>{shop.name}</span>
        </Link>

        <button
          className="topnav-toggle"
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          &#9776;
        </button>

        <nav className={`topnav-links ${open ? "open" : ""}`}>
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="topnav-user">
          <Link href="/account" className="topnav-chip">
            <span className="topnav-avatar" aria-hidden>
              {user.displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="topnav-chip-text">
              <strong>{user.displayName}</strong>
              <em>{roleLabel}</em>
            </span>
          </Link>
          <form action="/logout" method="post">
            <button className="btn btn-ghost" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
