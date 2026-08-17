"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";
import { SUBJECTS } from "@/lib/types";
import type { Material } from "@/lib/types";

interface NoteEditorProps {
  material: Material;
  onClose: () => void;
  onSaved: () => void;
}

export default function NoteEditor({ material, onClose, onSaved }: NoteEditorProps) {
  const [title, setTitle] = useState(material.title);
  const [subject, setSubject] = useState(material.subject);
  const [content, setContent] = useState(material.content ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const words = content.trim().split(/\s+/).filter(Boolean).length;

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim() || "General",
          content,
        }),
      });
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1600);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subject, content]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Note editor
            </p>
            <p className="text-[11px] text-slate-400">
              {words} words · {content.length} characters · Ctrl/Cmd + S to save
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close editor"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-ink"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 px-6 pt-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 font-serif text-lg font-bold text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            list="note-subjects"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-44 shrink-0 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <datalist id="note-subjects">
            {SUBJECTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your notes…"
          className="mt-4 flex-1 resize-none px-6 pb-6 text-[15px] leading-relaxed text-ink outline-none placeholder:text-slate-300"
        />

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : savedFlash ? "Saved" : "Save note"}
          </button>
        </div>
      </div>
    </div>
  );
}