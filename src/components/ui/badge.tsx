const variants = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  neutral: "bg-text-muted/10 text-text-secondary",
  accent: "bg-accent-dim text-accent",
} as const;

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
