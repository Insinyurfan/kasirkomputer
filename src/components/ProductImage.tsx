/* eslint-disable @next/next/no-img-element */

export function ProductImage({
  src,
  name,
  size = 64,
  className = "",
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`product-img ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`product-img product-img-fallback ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
