import { describe, expect, it, vi } from "vitest";
import { getStateInstance } from "./greenApiClient.js";
import { isSecureApiUrl } from "./apiUrl.js";

describe("api url", () => {
  it("разрешает https и localhost только как development-исключение", () => {
    expect(isSecureApiUrl("https://4100.api.green-api.com", false)).toBe(true);
    expect(isSecureApiUrl("http://4100.api.green-api.com", false)).toBe(false);
    expect(isSecureApiUrl("http://localhost:3000", false)).toBe(false);
    expect(isSecureApiUrl("http://127.0.0.1:4010", true)).toBe(true);
    expect(isSecureApiUrl("http://[::1]:4010", true)).toBe(true);
    expect(isSecureApiUrl("http://example.com", true)).toBe(false);
    expect(isSecureApiUrl("not a url", true)).toBe(false);
  });

  it("не отправляет apiTokenInstance по обычному HTTP", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "{}",
    });

    await expect(
      getStateInstance({
        apiUrl: "http://example.com",
        idInstance: "1",
        apiTokenInstance: "secret-token",
      }),
    ).rejects.toThrow(/HTTPS/);
    expect(fetchMock).not.toHaveBeenCalled();

    await getStateInstance({
      apiUrl: "http://localhost:3000",
      idInstance: "1",
      apiTokenInstance: "secret-token",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("http://localhost:3000");
    expect(String(fetchMock.mock.calls[0][0])).toContain("secret-token");

    fetchMock.mockClear();
    await getStateInstance({
      apiUrl: "https://4100.api.green-api.com",
      idInstance: "9",
      apiTokenInstance: "secret-token",
    });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/4100\.api\.green-api\.com\//);
    fetchMock.mockRestore();
  });
});
