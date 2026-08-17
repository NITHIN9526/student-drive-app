"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar, { type View } from "@/components/Sidebar";
import MaterialCard from "@/components/MaterialCard";
import MaterialModal from "@/components/MaterialModal";
import NoteEditor from "@/components/NoteEditor";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  PlusIcon,
  SearchIcon,
  ClockIcon,
  LibraryIcon,
  PlayIcon,
  HeartIcon,
} from "@/components/icons";
import { TYPE_META, TYPES, formatBytes } from "@/lib/types";
import type { Material, MaterialType } from "@/lib/types";

type TypeFilter = "all" | MaterialType;

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [view, setView] = useState<View>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [noteEditor, setNoteEditor] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (view === "favorites" && m.favorite !== 1) return false;
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (subjectFilter !== "all" && m.subject !== subjectFilter) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        return (
          m.title.toLowerCase().includes(t) ||
          m.subject.toLowerCase().includes(t) ||
          (m.content ?? "").toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [materials, q, typeFilter, subjectFilter, view]);

  const subjects = useMemo(
    () => Array.from(new Set(materials.map((m) => m.subject))).sort(),
    [materials]
  );

  const stats = useMemo(
    () => ({
      total: materials.length,
      notes: materials.filter((m) => m.type === "notes").length,
      videos: materials.filter((m) => m.type === "video").length,
      files: materials.filter((m) => m.type !== "notes" && m.type !== "video").length,
    }),
    [materials]
  );

  const usedBytes = useMemo(
    () =>
      materials.reduce(
        (acc, m) => acc + (m.file_size ?? (m.content ?? "").length),
        0
      ),
    [materials]
  );

  function openMaterial(m: Material) {
    if (m.type === "notes") {
      setNoteEditor(m);
    } else if (m.url) {
      window.open(m.url, "_blank", "noopener");
    } else if (m.file_path) {
      window.open(`/api/files/${m.file_path}`, "_blank", "noopener");
    }
  }

  async function toggleFavorite(m: Material) {
    const next = m.favorite === 1 ? 0 : 1;
    setMaterials((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, favorite: next } : x))
    );
    await fetch(`/api/materials/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: next }),
    });
  }

  async function deleteMaterial(m: Material) {
    await fetch(`/api/materials/${m.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(m: Material) {
    setEditing(m);
    setModalOpen(true);
  }

  function navigate(view: View) {
    setView(view);
    if (view === "favorites") {
      setTypeFilter("all");
    }
  }

  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar
        active={view}
        onNavigate={navigate}
        usedBytes={usedBytes}
        totalBytes={15 * 1024 * 1024 * 1024}
      />

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 lg:px-8">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-serif text-lg font-bold text-white lg:hidden">
              S
            </span>
            <label className="flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <SearchIcon width={18} height={18} className="shrink-0 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes, subjects, or links…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="text-[11px] font-bold text-slate-400 hover:text-ink"
                >
                  Clear
                </button>
              )}
            </label>
            <button
              onClick={openAdd}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              <PlusIcon width={17} height={17} />
              <span className="hidden sm:inline">Add material</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
          <section className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {today}
              </p>
              <h1 className="mt-2 font-serif text-4xl font-bold leading-tight text-ink">
                {greeting}.
                <br />
                Make today <em className="text-primary not-italic underline decoration-primary/30 decoration-4 underline-offset-4">count.</em>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Everything you need for your next great study session, all in
                one calm place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="text-2xl font-bold text-ink">{stats.total}</p>
                <p className="text-[11px] font-semibold text-slate-400">Materials</p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="text-2xl font-bold text-ink">{stats.notes}</p>
                <p className="text-[11px] font-semibold text-slate-400">Notes</p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="text-2xl font-bold text-ink">{stats.videos}</p>
                <p className="text-[11px] font-semibold text-slate-400">Videos</p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="text-2xl font-bold text-ink">{stats.files}</p>
                <p className="text-[11px] font-semibold text-slate-400">Files</p>
              </div>
            </div>
          </section>

          {materials.length > 0 && (
            <section className="mt-12">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Quick access
                </p>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <ClockIcon width={13} height={13} />
                  Recently added
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {materials.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openMaterial(m)}
                    className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-line bg-white p-3.5 text-left transition hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${TYPE_META[m.type].badgeClass}`}
                    >
                      {m.type === "video" ? (
                        <PlayIcon width={15} height={15} />
                      ) : (
                        TYPE_META[m.type].badge
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">
                        {m.title}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {TYPE_META[m.type].label} · {m.subject}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {view === "favorites" ? "Your favorites" : "Your library"}
                </p>
                <h2 className="font-serif text-2xl font-bold text-ink">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "material" : "materials"}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <LibraryIcon width={14} height={14} />
                  {formatBytes(usedBytes)} stored
                </span>
                {view === "favorites" && (
                  <span className="flex items-center gap-1.5 text-rose-500">
                    <HeartIcon width={14} height={14} filled />
                    Favorites
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", ...TYPES] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    typeFilter === t
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {t === "all" ? "All materials" : TYPE_META[t].chip}
                </button>
              ))}
            </div>

            {subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setSubjectFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    subjectFilter === "all"
                      ? "bg-pale text-primary"
                      : "text-slate-400 hover:text-ink"
                  }`}
                >
                  All subjects
                </button>
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubjectFilter(subjectFilter === s ? "all" : s)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      subjectFilter === s
                        ? "bg-pale text-primary"
                        : "text-slate-400 hover:text-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pale text-primary">
                    <LibraryIcon width={26} height={26} />
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-bold text-ink">
                    {q || typeFilter !== "all" || subjectFilter !== "all" || view === "favorites"
                      ? "Nothing matches your filters"
                      : "Your Drive is empty"}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                    {q || typeFilter !== "all" || subjectFilter !== "all" || view === "favorites"
                      ? "Try a different search, or clear the filters to see everything."
                      : "Add your first study material — notes, PDFs, YouTube links, or images."}
                  </p>
                  <button
                    onClick={openAdd}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
                  >
                    <PlusIcon width={16} height={16} />
                    Add study material
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((m) => (
                    <MaterialCard
                      key={m.id}
                      material={m}
                      onOpen={openMaterial}
                      onEdit={openEdit}
                      onDelete={setDeleting}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <MaterialModal
        key={`${modalOpen ? "open" : "closed"}-${editing ? `edit-${editing.id}` : "new"}`}
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />

      {noteEditor && (
        <NoteEditor
          material={noteEditor}
          onClose={() => setNoteEditor(null)}
          onSaved={load}
        />
      )}

      {deleting && (
        <ConfirmDialog
          material={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={() => deleteMaterial(deleting)}
        />
      )}
    </div>
  );
}