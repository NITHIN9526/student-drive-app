"use client";

import { useState } from "react";
import { XIcon, UploadIcon } from "@/components/icons";
import { SUBJECTS, TYPE_META, TYPES, formatBytes } from "@/lib/types";
import type { Material, MaterialType } from "@/lib/types";

interface MaterialModalProps {
  open: boolean;
  initial: Material | null;
  onClose: () => void;
  onSaved: () => void;
}

const ACCEPT: Partial<Record<MaterialType, string>> = {
  pdf: "application/pdf,.pdf",
  image: "image/*",
  file: "",
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB — Vercel's serverless body limit is ~4.5 MB

export default function MaterialModal({ open, initial, onClose, onSaved }: MaterialModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<MaterialType>(initial?.type ?? "notes");
  const [subject, setSubject] = useState(initial?.subject ?? "General");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const isEdit = Boolean(initial);
  const showContent = type === "notes";
  const showUrl =
    type === "video" ||
    type === "pdf" ||
    type === "file";
  const showFile = type === "pdf" || type === "image" || type === "file";
  const hasExistingFile = Boolean(initial?.file_path);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give this material a title.");
      return;
    }

    const form = new FormData();
    form.set("title", title.trim());
    form.set("type", type);
    form.set("subject", subject.trim() || "General");
    form.set("url", url.trim());
    form.set("content", content);
    if (file) form.set("file", file);
    if (isEdit && removeFile) form.set("removeFile", "1");

    if (file && file.size > MAX_FILE_SIZE) {
      setError(
        `That file is ${formatBytes(file.size)}. Vercel's free plan allows uploads up to 4 MB — try a smaller file.`
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        isEdit ? `/api/materials/${initial!.id}` : "/api/materials",
        { method: isEdit ? "PATCH" : "POST", body: form }
      );
      let data: { error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        /* non-JSON error body */
      }
      if (!res.ok) {
        setError(
          data?.error ||
            `Upload failed (${res.status}). Check that your storage is configured.`
        );
        setSaving(false);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              {isEdit ? "EDIT RESOURCE" : "NEW RESOURCE"}
            </p>
            <h2 className="font-serif text-2xl font-bold text-ink">
              {isEdit ? "Update study material" : "Add study material"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-ink"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-ink">Title</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic chemistry revision"
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-ink">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MaterialType)}
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-ink">Subject</span>
              <input
                list="subjects"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Pick or type"
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="subjects">
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
          </div>

          {showContent && (
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink">
                Notes
                <span className="text-[11px] font-medium text-slate-400">
                  {content.trim().length} characters
                </span>
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Write your study notes here…"
                className="w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          {showUrl && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-ink">
                {type === "video" ? "YouTube link" : "Link (optional)"}
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  type === "video"
                    ? "https://www.youtube.com/watch?v=…"
                    : "https://…"
                }
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          {showFile && (
            <div className="rounded-xl border border-dashed border-line bg-paper p-4">
              <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-pale text-primary">
                  <UploadIcon width={20} height={20} />
                </span>
                <span className="text-xs font-semibold text-ink">
                  {file ? file.name : "Click to upload a file"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {file ? formatBytes(file.size) : `Accepted: ${type === "pdf" ? "PDF" : type === "image" ? "images" : "any document"}`}
                </span>
                <input
                  type="file"
                  accept={ACCEPT[type]}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              {hasExistingFile && (
                <label className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
                  <input
                    type="checkbox"
                    checked={removeFile}
                    onChange={(e) => setRemoveFile(e.target.checked)}
                  />
                  Remove current file ({initial!.file_name})
                </label>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add to Drive"}
          </button>
        </div>
      </form>
    </div>
  );
}