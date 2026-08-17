"use client";

import { TrashIcon } from "@/components/icons";
import type { Material } from "@/lib/types";

interface ConfirmDialogProps {
  material: Material;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ material, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
          <TrashIcon width={22} height={22} />
        </span>
        <h3 className="mt-4 font-serif text-xl font-bold text-ink">Delete material?</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          “{material.title}” and its attached file (if any) will be permanently
          removed from your Drive.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}