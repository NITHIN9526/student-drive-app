"use client";

import { useState } from "react";
import {
  PlayIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { TYPE_META, formatDate, formatBytes, youtubeId } from "@/lib/types";
import type { Material } from "@/lib/types";

interface MaterialCardProps {
  material: Material;
  onOpen: (m: Material) => void;
  onEdit: (m: Material) => void;
  onDelete: (m: Material) => void;
  onToggleFavorite: (m: Material) => void;
}

export default function MaterialCard({
  material,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}: MaterialCardProps) {
  const meta = TYPE_META[material.type];
  const thumb = material.type === "video" ? youtubeId(material.url) : null;
  const imageSrc =
    material.type === "image" && material.file_path
      ? material.file_path
      : null;
  const isFavorite = material.favorite === 1;
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <article
      onClick={() => onOpen(material)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div className="relative h-36 overflow-hidden">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- image covers are Vercel Blob URLs
          <img
            src={imageSrc}
            alt={material.title}
            onError={() => setCoverFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : thumb && !coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnails are remote images
          <img
            src={`https://i.ytimg.com/vi/${thumb}/hqdefault.jpg`}
            alt={material.title}
            onError={() => setCoverFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`grid h-full w-full place-items-center bg-gradient-to-br ${meta.accent}`}
          >
            <span className="font-serif text-4xl font-bold text-white/90">
              {material.type === "notes" ? "Aa" : meta.badge}
            </span>
          </div>
        )}

        {thumb && !coverFailed && (
          <span className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-red-600 shadow-lg">
              <PlayIcon width={22} height={22} className="ml-1" />
            </span>
          </span>
        )}

        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}
        >
          {meta.label}
        </span>

        {material.type === "video" && !thumb && (
          <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600">
            <PlayIcon width={16} height={16} className="ml-0.5" />
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(material);
          }}
          aria-label="Toggle favorite"
          className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full transition-colors ${
            isFavorite
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-slate-400 hover:text-rose-500"
          }`}
        >
          <HeartIcon width={16} height={16} filled={isFavorite} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-ink">
          {material.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            {material.subject}
          </span>
          <span>·</span>
          <span>{formatDate(material.updated_at)}</span>
          {material.file_size != null && (
            <>
              <span>·</span>
              <span>{formatBytes(material.file_size)}</span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[11px] font-medium text-slate-400">
            {material.type === "notes"
              ? `${(material.content ?? "").split(/\s+/).filter(Boolean).length} words`
              : material.type === "video"
                ? "Watch on YouTube"
                : material.file_name || "View resource"}
          </span>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(material);
              }}
              aria-label="Edit"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-pale hover:text-primary"
            >
              <PencilIcon width={15} height={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(material);
              }}
              aria-label="Delete"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <TrashIcon width={15} height={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}