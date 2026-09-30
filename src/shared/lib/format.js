import { MS_PER_DAY } from "../config/constants.js";

export function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatListTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return formatClock(timestamp);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function dayTitle(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const startOf = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = startOf(today) - startOf(date);
  if (diff === 0) return "Сегодня";
  if (diff === MS_PER_DAY) return "Вчера";
  const options = { day: "numeric", month: "long" };
  if (date.getFullYear() !== today.getFullYear()) options.year = "numeric";
  return date.toLocaleDateString("ru-RU", options);
}

export function previewText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

const AVATAR_COLORS = ["#3390ec", "#6D5EF6", "#0F9F6E", "#E07A1F", "#D63B78", "#1C8C9C"];

export function avatarColor(id) {
  let hash = 0;
  const value = String(id || "");
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(title) {
  const clean = String(title || "").trim();
  if (!clean) return "?";
  const digits = clean.replace(/\D/g, "");
  const compact = clean.replace(/\s/g, "");
  if (digits.length >= 10 && digits.length >= compact.length - 4) {
    return digits.slice(-2);
  }
  const words = clean.split(/\s+/).filter(Boolean);
  const letters = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return letters.toUpperCase() || "?";
}
