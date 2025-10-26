import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h} hr ${m} min ${s} sec`;
    if (m > 0) return `${m} min ${s} sec`;
    return `${s} sec`;
}

export function formatDateLabel(dateString: number): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
}
