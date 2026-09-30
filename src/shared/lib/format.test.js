import { afterEach, describe, expect, it, vi } from "vitest";
import {
  avatarColor,
  dayTitle,
  formatClock,
  formatListTime,
  initials,
  previewText,
} from "./format.js";

describe("format", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("показывает сегодня, вчера и время в списке", () => {
    const today = new Date(2026, 8, 30, 15, 4, 0);
    vi.useFakeTimers();
    vi.setSystemTime(today);

    expect(dayTitle(today.getTime())).toBe("Сегодня");
    expect(dayTitle(new Date(2026, 8, 29, 11, 0, 0).getTime())).toBe("Вчера");
    expect(dayTitle(new Date(2025, 0, 2, 11, 0, 0).getTime())).toMatch(/2025/);
    expect(formatListTime(today.getTime())).toBe(formatClock(today.getTime()));
    expect(formatListTime(new Date(2026, 8, 1, 11, 0, 0).getTime())).not.toBe("");
    expect(formatClock(today.getTime())).toMatch(/\d{2}:\d{2}/);
  });

  it("сжимает пробелы в превью и собирает инициалы", () => {
    expect(previewText("  привет\n  мир  ")).toBe("привет мир");
    expect(initials("Иван Петров")).toBe("ИП");
    expect(initials("+7 999 123-45-67")).toBe("67");
    expect(initials("")).toBe("?");
  });

  it("выбирает стабильный цвет аватара", () => {
    expect(avatarColor("chat-1")).toBe(avatarColor("chat-1"));
    expect(avatarColor("chat-1")).toMatch(/^#/);
  });
});
