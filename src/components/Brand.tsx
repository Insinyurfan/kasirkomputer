/* eslint-disable @next/next/no-img-element */

export function BrandLogo({
  name,
  logoUrl,
  size = 30,
  className = "",
}: {
  name: string;
  logoUrl: string | null | undefined;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className={`brand-logo ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`brand-logo brand-logo-letter ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
