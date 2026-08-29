"use client";

export function ConfirmButton({
  children,
  confirm,
  className = "btn btn-sm danger",
}: {
  children: React.ReactNode;
  confirm: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
