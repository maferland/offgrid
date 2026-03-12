"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  Clock,
  AtSign,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/publish", label: "Publish", icon: Send },
  { href: "/queue", label: "Queue", icon: Clock },
  { href: "/mentions", label: "Mentions", icon: AtSign },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[200px] flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-5">
        <Image src="/logo-64.png" alt="Offgrid" width={28} height={28} className="rounded-lg" />
        <span className="text-lg font-semibold text-text">Offgrid</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-surface-elevated font-medium text-text"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
