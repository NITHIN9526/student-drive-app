"use client";

import { HomeIcon, LibraryIcon, HeartIcon } from "@/components/icons";
import { formatBytes } from "@/lib/types";

export type View = "all" | "favorites";

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
  usedBytes: number;
  totalBytes: number;
}

export default function Sidebar({ active, onNavigate, usedBytes, totalBytes }: SidebarProps) {
  const pct = Math.min(100, Math.round((usedBytes / totalBytes) * 100));

  const nav = [
    { key: "all" as View, label: "Home", icon: HomeIcon },
    { key: "all" as View, label: "My Library", icon: LibraryIcon },
    { key: "favorites" as View, label: "Favorites", icon: HeartIcon },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white px-5 py-7 lg:flex">
      <a className="mb-10 ml-3 flex items-center gap-3" href="#">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-serif text-xl font-bold text-white">
          S
        </span>
        <span className="font-serif text-lg font-bold leading-tight text-ink">
          Students
          <br />
          Drive
        </span>
      </a>

      <nav className="flex flex-col gap-1.5">
        {nav.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={label}
              onClick={() => onNavigate(key)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-pale text-primary"
                  : "text-slate-500 hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <Icon width={19} height={19} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl bg-[#f7f9fe] p-4">
          <div className="text-[11px] font-medium text-slate-500">
            Storage
            <strong className="mt-1 block text-xs font-bold text-ink">
              {formatBytes(usedBytes)} of {formatBytes(totalBytes)} used
            </strong>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#dce3f0]">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#ffdbbd] text-xs font-bold text-[#a3542f]">
            AR
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-ink">Aarav Rao</p>
            <p className="text-[11px] text-slate-400">Student account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}