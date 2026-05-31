"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "New PA" },
  { href: "/security", label: "Security log" },
  { href: "/portal/healthfirst/prior-auth", label: "HealthFirst portal", external: false },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login" || pathname.startsWith("/portal/healthfirst/submission")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#fafaf7]">
      <aside className="hidden w-56 shrink-0 border-r border-[#e4e7eb] bg-white md:flex md:flex-col">
        <div className="border-b border-[#e4e7eb] px-5 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b8410e]">
            Authmatic
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-[#0f1419]">Clinic console</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#fde9d9] text-[#b8410e]"
                    : "text-[#5b6470] hover:bg-slate-50 hover:text-[#0f1419]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#e4e7eb] p-4 text-xs text-[#5b6470]">
          <p className="font-medium text-[#0f1419]">{user?.name}</p>
          <p>{user?.role} · {user?.clinic}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 text-[#b8410e] hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#e4e7eb] bg-white/90 px-6 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b8410e]">Authmatic</p>
            <button type="button" onClick={logout} className="text-xs text-[#b8410e]">
              Sign out
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto text-xs">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full border border-[#e4e7eb] px-3 py-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-6 py-8">
          {title && (
            <h1 className="mb-6 font-serif text-3xl font-semibold text-[#0f1419]">{title}</h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
