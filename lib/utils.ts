import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseDisplayDate(date: string) {
  // Date-only CMS values should render as the entered calendar day instead of
  // shifting with timezone conversion. Prisma timestamps are already complete
  // ISO strings and must not have another time component appended.
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date);
}

export function formatDate(date: string) {
  return parseDisplayDate(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: string) {
  return parseDisplayDate(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}
