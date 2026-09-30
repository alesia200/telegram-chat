import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_STORED_MESSAGES } from "../config/constants.js";
import { loadChats, loadCredentials, saveChats, saveCredentials } from "./storage.js";

const credentials = {
  apiUrl: "https://4100.api.green-api.com",
  idInstance: "42",
  apiTokenInstance: "token",
};

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("сохраняет и читает учётные данные", () => {
    expect(saveCredentials(credentials)).toEqual({ ok: true });
    expect(loadCredentials()).toEqual(credentials);
  });

  it("обрезает историю и сообщает об ошибке записи", () => {
    const messages = Array.from({ length: MAX_STORED_MESSAGES + 5 }, (_, index) => ({
      id: `m-${index}`,
      text: "x",
      outgoing: true,
      timestamp: index,
    }));
    expect(saveChats("42", [{ id: "1", phone: "", title: "A", updatedAt: 1, messages }])).toEqual({
      ok: true,
    });
    expect(loadChats("42")[0].messages).toHaveLength(MAX_STORED_MESSAGES);
    expect(loadChats("42")[0].messages[0].id).toBe("m-5");

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(saveChats("42", [{ id: "1", messages: [] }]).ok).toBe(false);
    vi.restoreAllMocks();
  });

  it("игнорирует повреждённую историю", () => {
    localStorage.setItem("telegram-chat-chats:42", "{");
    expect(loadChats("42")).toEqual([]);
  });
});
