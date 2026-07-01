"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  items: NavItem[];
  avatarUrl: string | null;
  userName: string | null;
}

export function TopNavClient({ items, avatarUrl, userName }: Props) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/60">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "text-white bg-neutral-800"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden relative border-2 border-neutral-700 hover:border-brand-500 active:scale-95 transition-all shrink-0"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName ?? "Profile"}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-bold text-neutral-400">
                {(userName ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
