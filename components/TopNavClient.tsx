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
    <header className="fixed top-0 inset-x-0 z-50 bg-page/90 backdrop-blur-md border-b border-ink/10">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "text-ink bg-ink/10"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-sunken overflow-hidden relative border-2 border-ink/15 hover:border-brand-500 active:scale-95 transition-all shrink-0"
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
              <span className="text-xs font-bold text-ink/50">
                {(userName ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
