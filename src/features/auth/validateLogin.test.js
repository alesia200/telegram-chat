import { describe, expect, it } from "vitest";
import { validateLoginForm } from "./validateLogin.js";

describe("validateLoginForm", () => {
  const valid = {
    apiUrl: "https://4100.api.green-api.com/",
    idInstance: " 123 ",
    apiTokenInstance: " token ",
  };

  it("принимает https-адрес инстанса", () => {
    expect(validateLoginForm(valid, false)).toBe("");
  });

  it("запрещает обычный HTTP вне localhost", () => {
    expect(validateLoginForm({ ...valid, apiUrl: "http://example.com" }, true)).toMatch(/HTTPS/);
    expect(validateLoginForm({ ...valid, apiUrl: "http://localhost:3000" }, false)).toMatch(
      /HTTPS/,
    );
    expect(validateLoginForm({ ...valid, apiUrl: "http://localhost:3000" }, true)).toBe("");
  });

  it("проверяет idInstance и токен", () => {
    expect(validateLoginForm({ ...valid, idInstance: "12a" }, false)).toMatch(/idInstance/);
    expect(validateLoginForm({ ...valid, apiTokenInstance: "  " }, false)).toMatch(
      /apiTokenInstance/,
    );
    expect(validateLoginForm({ ...valid, apiUrl: "ftp://files.example" }, false)).toMatch(/apiUrl/);
  });
});
