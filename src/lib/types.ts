export type MaterialType = "notes" | "pdf" | "video" | "image" | "file";

export interface Material {
  id: number;
  title: string;
  type: MaterialType;
  subject: string;
  content: string | null;
  url: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  favorite: number;
  created_at: string;
  updated_at: string;
}

export const SUBJECTS = [
  "General",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Other",
];

export const TYPES: MaterialType[] = ["notes", "pdf", "video", "image", "file"];

export const TYPE_META: Record<
  MaterialType,
  { label: string; badge: string; chip: string; badgeClass: string; accent: string }
> = {
  notes: {
    label: "Notes",
    badge: "N",
    chip: "Notes",
    badgeClass: "bg-blue-100 text-blue-700",
    accent: "from-blue-500 to-indigo-500",
  },
  pdf: {
    label: "PDF",
    badge: "P",
    chip: "PDFs",
    badgeClass: "bg-rose-100 text-rose-700",
    accent: "from-rose-500 to-red-500",
  },
  video: {
    label: "YouTube",
    badge: "Play",
    chip: "Videos",
    badgeClass: "bg-red-100 text-red-700",
    accent: "from-red-500 to-orange-500",
  },
  image: {
    label: "Image",
    badge: "I",
    chip: "Images",
    badgeClass: "bg-emerald-100 text-emerald-700",
    accent: "from-emerald-500 to-teal-500",
  },
  file: {
    label: "File",
    badge: "F",
    chip: "Files",
    badgeClass: "bg-violet-100 text-violet-700",
    accent: "from-violet-500 to-purple-500",
  },
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `Today · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}