import { useEffect, useRef, useState } from "react";
import { MESSAGE_LIMIT, checkAccount, deleteNotification, getStateInstance, receiveNotification, sendMessage } from "./api.js";
import {
  addLocalMessage,
  applyMessageEvent,
  applyStatusEvent,
  createChat,
  ensureChat,
  patchMessage,
  removeMessage,
} from "./chats.js";
import LoginScreen from "./components/LoginScreen.jsx";
import Messenger from "./components/Messenger.jsx";
import { interpretNotification } from "./notifications.js";
import { formatPhone, formatUsername, parseRecipient } from "./phone.js";
import { clearCredentials, loadChats, loadCredentials, saveChats, saveCredentials } from "./storage.js";

const processedReceipts = new Set();

const LOGIN_BLOCK = {
  notAuthorized:
    "Инстанс не авторизован. Авторизуйте инстанс Telegram в личном кабинете GREEN-API.",
  blocked: "Аккаунт Telegram заблокирован.",
  starting: "Инстанс запускается. Подождите несколько минут и войдите снова.",
  pendingPassword:
    "Чтобы закончить авторизацию, укажите пароль двухфакторной аутентификации в личном кабинете.",
};

function rememberReceipt(id) {
  processedReceipts.add(id);
  if (processedReceipts.size > 500) {
    const oldest = processedReceipts.values().next().value;
    processedReceipts.delete(oldest);
  }
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function explainPollError(message) {
  if (/webhook/i.test(message || "")) {
    return "Входящие не приходят: в личном кабинете очистите webhook URL и включите уведомления о входящих сообщениях. После сохранения подождите около минуты.";
  }
  return message || "Не удалось получить входящие сообщения";
}

export default function App() {
  const [credentials, setCredentials] = useState(() => loadCredentials());
  const [chats, setChats] = useState(() => {
    const saved = loadCredentials();
    return saved ? loadChats(saved.idInstance) : [];
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [instanceState, setInstanceState] = useState("");
  const [pollError, setPollError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const handleRef = useRef(() => {});

  useEffect(() => {
    if (!credentials) return;
    saveChats(credentials.idInstance, chats);
  }, [credentials, chats]);

  handleRef.current = (payload) => {
    const event = interpretNotification(payload);
    if (!event) return;
    if (event.kind === "status") {
      setChats((prev) => applyStatusEvent(prev, event));
      return;
    }
    setChats((prev) => applyMessageEvent(prev, event));
  };

  useEffect(() => {
    if (!credentials) return undefined;
    let cancelled = false;
    getStateInstance(credentials)
      .then((data) => {
        if (!cancelled) setInstanceState(data?.stateInstance || "");
      })
      .catch((error) => {
        if (!cancelled) setPollError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [credentials]);

  useEffect(() => {
    if (!credentials) return undefined;
    const controller = new AbortController();
    let stopped = false;

    async function loop() {
      while (!stopped) {
        try {
          const notification = await receiveNotification(credentials, 20, controller.signal);
          if (stopped) return;
          setPollError("");
          if (!notification?.receiptId) continue;

          // Очередь FIFO: пока уведомление не удалено, следующее не придёт.
          if (!processedReceipts.has(notification.receiptId)) {
            rememberReceipt(notification.receiptId);
            try {
              handleRef.current(notification);
            } catch (error) {
              console.error(error);
            }
          }
          await deleteNotification(credentials, notification.receiptId, controller.signal);
        } catch (error) {
          if (error?.name === "AbortError" || stopped) return;
          setPollError(explainPollError(error.message));
          try {
            await wait(4000, controller.signal);
          } catch {
            return;
          }
        }
      }
    }

    loop();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [credentials]);

  async function login(form) {
    const next = {
      apiUrl: form.apiUrl.trim().replace(/\/+$/, ""),
      idInstance: form.idInstance.trim(),
      apiTokenInstance: form.apiTokenInstance.trim(),
    };

    if (!/^https?:\/\//i.test(next.apiUrl)) {
      setLoginError("Укажите apiUrl из личного кабинета, например https://4100.api.green-api.com");
      return;
    }
    if (!/^\d+$/.test(next.idInstance)) {
      setLoginError("idInstance должен состоять из цифр");
      return;
    }
    if (!next.apiTokenInstance) {
      setLoginError("Введите apiTokenInstance");
      return;
    }

    setLoginPending(true);
    setLoginError("");
    try {
      const data = await getStateInstance(next);
      const state = data?.stateInstance || "";
      if (LOGIN_BLOCK[state]) {
        setLoginError(LOGIN_BLOCK[state]);
        return;
      }
      saveCredentials(next);
      setCredentials(next);
      setChats(loadChats(next.idInstance));
      setInstanceState(state);
      setActiveChatId(null);
      setPollError("");
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginPending(false);
    }
  }

  function logout() {
    clearCredentials();
    setCredentials(null);
    setChats([]);
    setActiveChatId(null);
    setInstanceState("");
    setPollError("");
  }

  async function startChat(raw) {
    const recipient = parseRecipient(raw);
    if (recipient.error) throw new Error(recipient.error);

    const result = await checkAccount(credentials, recipient);
    if (!result?.exist || result.chatId == null || result.chatId === "") {
      throw new Error("Аккаунт Telegram не найден. Проверьте номер или @username");
    }

    const id = String(result.chatId);
    const phone = result.phoneNumber ? String(result.phoneNumber) : recipient.phone || "";
    const username = formatUsername(result.username || recipient.username || "");
    const title = username || formatPhone(phone) || id;

    setChats((prev) => {
      const found = prev.find((chat) => chat.id === id);
      if (!found) return ensureChat(prev, createChat({ id, phone, username, title }));
      return prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              phone: chat.phone || phone,
              username: chat.username || username,
            }
          : chat
      );
    });
    setActiveChatId(id);
  }

  async function submitMessage(text) {
    const chatId = activeChatId;
    const trimmed = text.trim();
    if (!chatId || !trimmed) return;
    if (trimmed.length > MESSAGE_LIMIT) {
      throw new Error(`Текст длиннее ${MESSAGE_LIMIT} символов`);
    }

    const localId = `local-${crypto.randomUUID()}`;
    setChats((prev) =>
      addLocalMessage(prev, chatId, {
        id: localId,
        text: trimmed,
        outgoing: true,
        timestamp: Date.now(),
        status: "sending",
      })
    );

    try {
      const result = await sendMessage(credentials, chatId, trimmed);
      setChats((prev) =>
        patchMessage(prev, chatId, localId, {
          id: result?.idMessage ? String(result.idMessage) : localId,
          status: "sent",
        })
      );
    } catch (error) {
      setChats((prev) =>
        patchMessage(prev, chatId, localId, {
          status: "error",
          error: error.message,
        })
      );
    }
  }

  async function retryMessage(message) {
    const chatId = activeChatId;
    if (!chatId || !message?.text) return;
    setChats((prev) => removeMessage(prev, chatId, message.id));
    await submitMessage(message.text);
  }

  if (!credentials) {
    return <LoginScreen onSubmit={login} pending={loginPending} error={loginError} />;
  }

  const warning = LOGIN_BLOCK[instanceState]
    ? LOGIN_BLOCK[instanceState]
    : instanceState === "suspended"
      ? "На аккаунте временные ограничения: сообщения уходят только тем, кто сохранил ваш номер в контактах."
      : "";

  return (
    <Messenger
      idInstance={credentials.idInstance}
      chats={chats}
      activeChatId={activeChatId}
      instanceState={instanceState}
      warning={warning}
      pollError={pollError}
      onSelectChat={setActiveChatId}
      onLogout={logout}
      onStartChat={startChat}
      onSend={submitMessage}
      onRetry={retryMessage}
    />
  );
}
