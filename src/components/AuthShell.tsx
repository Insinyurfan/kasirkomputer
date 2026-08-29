import { BrandLogo } from "@/components/Brand";
import { DEFAULT_SHOP_NAME } from "@/lib/shop";

/**
 * Split-screen layout for /login and /setup: a blue gradient panel with an
 * illustration on the left, the form card on the right (blue → white gradient).
 */
export function AuthShell({
  shop = { name: DEFAULT_SHOP_NAME, logoUrl: null },
  eyebrow,
  title,
  subtitle,
  headline,
  blurb,
  children,
}: {
  shop?: { name: string; logoUrl: string | null };
  eyebrow: string;
  title: string;
  subtitle: string;
  headline: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-hero">
        <div className="auth-hero-top">
          <BrandLogo name={shop.name} logoUrl={shop.logoUrl} size={44} className="auth-logo" />
          <div>
            <div className="auth-hero-brand-sub">POS</div>
            <strong className="auth-hero-brand">{shop.name}</strong>
          </div>
        </div>

        <div className="auth-hero-body">
          <span className="auth-pill">{eyebrow}</span>
          <h2 className="auth-hero-headline">{headline}</h2>
          <p className="auth-hero-blurb">{blurb}</p>
        </div>

        <RegisterIllustration />
      </aside>

      <main className="auth-form-side">
        <div className="auth-form-card">
          <BrandLogo name={shop.name} logoUrl={shop.logoUrl} size={40} className="auth-logo auth-logo-sm" />
          <p className="auth-eyebrow">{title}</p>
          <h1 className="auth-title">{subtitle}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}

function RegisterIllustration() {
  return (
    <svg
      className="auth-illustration"
      viewBox="0 0 320 220"
      fill="none"
      aria-hidden
    >
      <rect x="40" y="30" width="240" height="150" rx="14" fill="#ffffff" opacity="0.12" />
      <rect x="64" y="54" width="140" height="14" rx="7" fill="#ffffff" opacity="0.55" />
      <rect x="64" y="82" width="192" height="9" rx="4.5" fill="#ffffff" opacity="0.3" />
      <rect x="64" y="100" width="176" height="9" rx="4.5" fill="#ffffff" opacity="0.3" />
      <rect x="64" y="118" width="120" height="9" rx="4.5" fill="#ffffff" opacity="0.3" />
      <rect x="64" y="146" width="80" height="20" rx="10" fill="#22c55e" opacity="0.85" />
      <circle cx="232" cy="150" r="26" fill="#ffffff" opacity="0.2" />
      <path
        d="M223 150l6 6 12-13"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
