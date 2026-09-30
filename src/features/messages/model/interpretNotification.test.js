import { describe, expect, it } from "vitest";
import { interpretNotification } from "./interpretNotification.js";

function messagePayload(typeWebhook, extra = {}) {
  return {
    receiptId: 1,
    body: {
      typeWebhook,
      timestamp: 1_700_000_000,
      idMessage: "msg-1",
      senderData: {
        chatId: "555",
        senderPhoneNumber: "79991234567",
        senderName: "Анна",
      },
      messageData: {
        textMessageData: { textMessage: "Привет" },
      },
      ...extra,
    },
  };
}

describe("interpretNotification", () => {
  it("разбирает входящее сообщение", () => {
    expect(interpretNotification(messagePayload("incomingMessageReceived"))).toMatchObject({
      kind: "message",
      chatId: "555",
      outgoing: false,
      text: "Привет",
      id: "msg-1",
      timestamp: 1_700_000_000_000,
      title: "Анна",
      phone: "79991234567",
    });
  });

  it("разбирает исходящие сообщения API и мессенджера", () => {
    expect(interpretNotification(messagePayload("outgoingMessageReceived"))).toMatchObject({
      kind: "message",
      outgoing: true,
      text: "Привет",
    });
    expect(interpretNotification(messagePayload("outgoingAPIMessageReceived"))).toMatchObject({
      kind: "message",
      outgoing: true,
    });
  });

  it("берёт текст из extended и quoted payload и оставляет миллисекунды", () => {
    const extended = messagePayload("incomingMessageReceived", {
      timestamp: 1_700_000_000_123,
      idMessage: "",
      messageData: { extendedTextMessageData: { text: "  длинное  " } },
    });
    expect(interpretNotification(extended)).toMatchObject({
      text: "  длинное  ",
      timestamp: 1_700_000_000_123,
      id: "in-1700000000123-555",
    });

    const quoted = messagePayload("incomingMessageReceived", {
      messageData: { quotedMessage: { textMessage: "цитата" } },
    });
    expect(interpretNotification(quoted)?.text).toBe("цитата");
  });

  it("разбирает статусы доставки", () => {
    expect(
      interpretNotification({
        body: {
          typeWebhook: "outgoingMessageStatus",
          idMessage: "msg-1",
          status: "delivered",
        },
      }),
    ).toEqual({ kind: "status", idMessage: "msg-1", status: "delivered", error: "" });

    expect(
      interpretNotification({
        body: { typeWebhook: "outgoingMessageStatus", idMessage: "msg-1", status: "read" },
      })?.status,
    ).toBe("delivered");

    expect(
      interpretNotification({
        body: {
          typeWebhook: "outgoingMessageStatus",
          idMessage: "msg-1",
          status: "failed",
          description: "нет аккаунта",
        },
      }),
    ).toMatchObject({ status: "error", error: "нет аккаунта" });

    expect(
      interpretNotification({
        body: { typeWebhook: "outgoingMessageStatus", idMessage: "msg-2", status: "noAccount" },
      })?.status,
    ).toBe("error");
  });

  it("игнорирует пустые и неизвестные уведомления", () => {
    expect(interpretNotification(null)).toBeNull();
    expect(interpretNotification({ body: { typeWebhook: "stateInstanceChanged" } })).toBeNull();
    expect(
      interpretNotification({
        body: { typeWebhook: "outgoingMessageStatus", status: "sent" },
      }),
    ).toBeNull();
    expect(
      interpretNotification({
        body: {
          typeWebhook: "incomingMessageReceived",
          senderData: { chatId: "1" },
          messageData: { textMessageData: { textMessage: "   " } },
        },
      }),
    ).toBeNull();
  });
});
