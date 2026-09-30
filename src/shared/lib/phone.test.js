import { describe, expect, it } from "vitest";
import { formatPhone, formatUsername, normalizePhone, parseRecipient } from "./phone.js";

describe("parseRecipient", () => {
  it("требует номер или username", () => {
    expect(parseRecipient("   ")).toEqual({ error: "Введите номер телефона или @username" });
  });

  it("принимает телефон в международном формате и приводит 8/9 к коду 7", () => {
    expect(parseRecipient("79991234567")).toEqual({ phone: "79991234567" });
    expect(parseRecipient("+7 999 123-45-67")).toEqual({ phone: "79991234567" });
    expect(parseRecipient("8 (999) 123-45-67")).toEqual({ phone: "79991234567" });
    expect(parseRecipient("9991234567")).toEqual({ phone: "79991234567" });
    expect(normalizePhone("89991234567")).toBe("79991234567");
  });

  it("форматирует российские и белорусские номера", () => {
    expect(formatPhone("79991234567")).toBe("+7 999 123-45-67");
    expect(formatPhone("375291234567")).toBe("+375 29 123-45-67");
    expect(parseRecipient("+375 29 123-45-67")).toEqual({ phone: "375291234567" });
  });

  it("отклоняет слишком короткий номер", () => {
    expect(parseRecipient("12345").error).toMatch(/международном формате/);
  });

  it("принимает Telegram username", () => {
    expect(parseRecipient("@alice")).toEqual({ username: "@alice" });
    expect(parseRecipient("alice_1")).toEqual({ username: "@alice_1" });
    expect(formatUsername("bob")).toBe("@bob");
  });

  it("отклоняет некорректный username", () => {
    expect(parseRecipient("@ab").error).toMatch(/Username/);
    expect(parseRecipient("@12345").error).toMatch(/Username/);
    expect(parseRecipient("user-name").error).toMatch(/Username/);
  });
});
