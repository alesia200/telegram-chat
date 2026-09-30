import { describe, expect, it } from "vitest";
import {
  addLocalMessage,
  applyMessageEvent,
  applyStatusEvent,
  chatReducer,
  createChat,
  patchMessage,
  removeMessage,
} from "./chatReducer.js";

const localMessage = {
  id: "local-1",
  text: "Привет",
  outgoing: true,
  timestamp: 10,
  status: "sending",
};

describe("chat model", () => {
  it("добавляет optimistic-сообщение и не дублирует его", () => {
    let chats = [createChat({ id: "1", phone: "79991234567", title: "Аня" })];
    chats = addLocalMessage(chats, "1", localMessage);
    expect(chats[0].messages).toEqual([localMessage]);

    chats = applyMessageEvent(chats, {
      id: "srv-1",
      text: "Привет",
      outgoing: true,
      timestamp: 12,
      chatId: "1",
      phone: "",
      title: "",
    });
    expect(chats[0].messages).toHaveLength(1);
    expect(chats[0].messages[0]).toMatchObject({ id: "srv-1", status: "sent" });

    const duplicate = applyMessageEvent(chats, {
      id: "srv-1",
      text: "Привет",
      outgoing: true,
      timestamp: 12,
      chatId: "1",
      phone: "",
      title: "",
    });
    expect(duplicate).toBe(chats);
  });

  it("проводит статус sending -> sent -> delivered и не откатывает его", () => {
    let chats = chatReducer([], {
      type: "upsert-opened",
      chat: { id: "1", phone: "79991234567", username: "@alice", title: "@alice" },
    });
    chats = chatReducer(chats, { type: "add-local", chatId: "1", message: localMessage });
    chats = chatReducer(chats, {
      type: "patch",
      chatId: "1",
      messageId: "local-1",
      patch: { id: "srv-1", status: "sent" },
    });
    expect(chats[0].messages[0].status).toBe("sent");

    chats = chatReducer(chats, {
      type: "status-event",
      event: { idMessage: "srv-1", status: "delivered" },
    });
    expect(chats[0].messages[0].status).toBe("delivered");

    const rolledBack = applyStatusEvent(chats, { idMessage: "srv-1", status: "sent" });
    expect(rolledBack[0].messages[0].status).toBe("delivered");
    expect(applyStatusEvent(rolledBack, { idMessage: "srv-1", status: "sending" })).toBe(
      rolledBack,
    );
  });

  it("не возвращает error к sent или delivered", () => {
    let chats = [createChat({ id: "1", title: "Аня" })];
    chats = addLocalMessage(chats, "1", { ...localMessage, id: "srv-1", status: "sent" });
    chats = applyStatusEvent(chats, { idMessage: "srv-1", status: "error", error: "сбой" });
    expect(chats[0].messages[0]).toMatchObject({ status: "error", error: "сбой" });
    chats = applyStatusEvent(chats, { idMessage: "srv-1", status: "delivered" });
    expect(chats[0].messages[0].status).toBe("error");
    chats = applyStatusEvent(chats, { idMessage: "srv-1", status: "sent" });
    expect(chats[0].messages[0].status).toBe("error");
  });

  it("повторяет failed-сообщение новым optimistic-сообщением", () => {
    let chats = [createChat({ id: "1", title: "Аня" })];
    chats = addLocalMessage(chats, "1", { ...localMessage, status: "error", error: "сеть" });
    chats = removeMessage(chats, "1", "local-1");
    expect(chats[0].messages).toHaveLength(0);
    chats = addLocalMessage(chats, "1", { ...localMessage, id: "local-2", status: "sending" });
    chats = patchMessage(chats, "1", "local-2", { id: "srv-2", status: "sent" });
    expect(chats[0].messages[0]).toMatchObject({ id: "srv-2", status: "sent", text: "Привет" });
  });

  it("создаёт чат из входящего события и не дублирует сообщение", () => {
    const event = {
      id: "in-1",
      text: "Добрый день",
      outgoing: false,
      timestamp: 30,
      chatId: "9",
      phone: "79990001122",
      title: "Анна",
    };
    const created = applyMessageEvent([], event);
    expect(created).toHaveLength(1);
    expect(created[0].messages).toHaveLength(1);
    expect(created[0].title).toBe("Анна");
    expect(applyMessageEvent(created, event)[0].messages).toHaveLength(1);
  });
});
