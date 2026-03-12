import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-text-muted" />
      <h3 className="text-lg font-medium text-text">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
