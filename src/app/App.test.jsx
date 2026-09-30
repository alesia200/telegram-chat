import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

const api = vi.hoisted(() => ({
  getStateInstance: vi.fn(),
  checkAccount: vi.fn(),
  sendMessage: vi.fn(),
  receiveNotification: vi.fn(),
  deleteNotification: vi.fn(),
}));

vi.mock("../shared/api/greenApiClient.js", () => api);

function abortError() {
  return new DOMException("Aborted", "AbortError");
}

function hang(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    signal?.addEventListener("abort", () => reject(abortError()), { once: true });
  });
}

function deliverOnce(signal, value) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => resolve(value), 20);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

async function login(user) {
  await user.type(screen.getByLabelText("idInstance"), "1100123456");
  await user.type(
    screen.getByLabelText(/apiTokenInstance/i, { selector: "input" }),
    "token-secret",
  );
  await user.click(screen.getByRole("button", { name: "Войти" }));
  expect(await screen.findByText("Чаты")).toBeInTheDocument();
}

describe("App", () => {
  const notifications = [];

  beforeEach(() => {
    localStorage.clear();
    notifications.length = 0;
    api.getStateInstance.mockImplementation((_credentials, signal) =>
      deliverOnce(signal, { stateInstance: "authorized" }),
    );
    api.checkAccount.mockResolvedValue({
      exist: true,
      chatId: 555,
      phoneNumber: "79991234567",
      username: "alice",
    });
    api.sendMessage.mockResolvedValue({ idMessage: "srv-1" });
    api.deleteNotification.mockImplementation((_credentials, _receiptId, signal) =>
      deliverOnce(signal, { result: true }),
    );
    api.receiveNotification.mockImplementation((_credentials, _timeout, signal) => {
      if (notifications.length === 0) return hang(signal);
      const next = notifications[0];
      return deliverOnce(signal, next).then((value) => {
        if (notifications[0] === next) notifications.shift();
        return value;
      });
    });
  });

  it("показывает ошибку и не вызывает API для обычного HTTP", async () => {
    const user = userEvent.setup();
    render(<App />);
    const apiUrl = screen.getByLabelText("apiUrl");
    await user.clear(apiUrl);
    await user.type(apiUrl, "http://example.com");
    await user.type(screen.getByLabelText("idInstance"), "1100123456");
    await user.type(
      screen.getByLabelText(/apiTokenInstance/i, { selector: "input" }),
      "token-secret",
    );
    await user.click(screen.getByRole("button", { name: "Войти" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/HTTPS/);
    expect(api.getStateInstance).not.toHaveBeenCalled();
  });

  it("входит после проверки инстанса", async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user);
    expect(screen.getByText("авторизован")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выйти" })).toBeInTheDocument();
  });

  it("создаёт чат и отправляет сообщение", async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user);
    await user.click(screen.getByRole("button", { name: "Новый чат" }));
    await user.type(await screen.findByLabelText("Телефон или @username"), "79991234567");
    await user.click(screen.getByRole("button", { name: "Создать" }));
    expect(await screen.findByRole("button", { name: /@alice/ })).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Текст сообщения" }), "Привет");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    expect(await screen.findByLabelText("Отправлено")).toBeInTheDocument();
    expect(screen.getByText("Привет")).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem("telegram-chat-chats:1100123456")).toContain("Привет");
    });
  });

  it("показывает входящее сообщение", async () => {
    notifications.push({
      receiptId: 7,
      body: {
        typeWebhook: "incomingMessageReceived",
        timestamp: 1_700_000_000,
        idMessage: "in-1",
        senderData: {
          chatId: "777",
          senderPhoneNumber: "79990001122",
          senderName: "Анна",
        },
        messageData: { textMessageData: { textMessage: "Добрый день" } },
      },
    });

    const user = userEvent.setup();
    render(<App />);
    await login(user);
    await user.click(await screen.findByRole("button", { name: /Анна/ }));
    expect(await screen.findAllByText("Добрый день")).toHaveLength(2);
    await waitFor(() => {
      expect(api.deleteNotification).toHaveBeenCalled();
    });
  });

  it("повторяет отправку после ошибки", async () => {
    api.sendMessage
      .mockRejectedValueOnce(new Error("Сеть недоступна"))
      .mockResolvedValueOnce({ idMessage: "srv-2" });

    const user = userEvent.setup();
    render(<App />);
    await login(user);
    await user.click(screen.getByRole("button", { name: "Новый чат" }));
    await user.type(await screen.findByLabelText("Телефон или @username"), "@alice");
    await user.click(screen.getByRole("button", { name: "Создать" }));
    await screen.findByRole("button", { name: /@alice/ });
    await user.type(screen.getByRole("textbox", { name: "Текст сообщения" }), "Ещё раз");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    await user.click(await screen.findByRole("button", { name: "Не отправлено. Повторить" }));
    expect(await screen.findByLabelText("Отправлено")).toBeInTheDocument();
    expect(api.sendMessage).toHaveBeenCalledTimes(2);
  });
});
