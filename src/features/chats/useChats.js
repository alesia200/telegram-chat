import { useCallback, useEffect, useRef, useState } from "react";
import { checkAccount, sendMessage } from "../../shared/api/greenApiClient.js";
import { MESSAGE_LIMIT } from "../../shared/config/constants.js";
import { formatPhone, formatUsername, parseRecipient } from "../../shared/lib/phone.js";
import { loadChats, loadCredentials, saveChats } from "../../shared/lib/storage.js";
import { interpretNotification } from "../messages/model/interpretNotification.js";
import { chatReducer } from "./model/chatReducer.js";

function createLocalId() {
  return `local-${globalThis.crypto.randomUUID()}`;
}

export const useChats = (credentials, sessionId, sessionRef) => {
  const instanceId = credentials?.idInstance ?? null;
  const [trackedInstanceId, setTrackedInstanceId] = useState(instanceId);
  const [chats, setChats] = useState(() => {
    const saved = loadCredentials();
    return saved ? loadChats(saved.idInstance) : [];
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [storageError, setStorageError] = useState("");
  const inflightRef = useRef(new Set());
  const credentialsRef = useRef(credentials);
  const activeChatIdRef = useRef(activeChatId);

  if (trackedInstanceId !== instanceId) {
    setTrackedInstanceId(instanceId);
    setChats(instanceId ? loadChats(instanceId) : []);
    setActiveChatId(null);
    setStorageError("");
  }

  useEffect(() => {
    credentialsRef.current = credentials;
  }, [credentials]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!credentials || trackedInstanceId !== credentials.idInstance) return;
    const result = saveChats(credentials.idInstance, chats);
    setStorageError(result.ok ? "" : result.message);
  }, [credentials, chats, trackedInstanceId]);

  useEffect(() => {
    const pool = inflightRef.current;
    return () => {
      for (const controller of pool) controller.abort();
      pool.clear();
    };
  }, [sessionId]);

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  const applyNotification = useCallback((payload) => {
    const event = interpretNotification(payload);
    if (!event) return;
    setChats((prev) =>
      chatReducer(
        prev,
        event.kind === "status"
          ? { type: "status-event", event }
          : { type: "message-event", event },
      ),
    );
  }, []);

  const submitMessage = useCallback(
    async (text, chatIdArg) => {
      const current = credentialsRef.current;
      const chatId = chatIdArg ?? activeChatIdRef.current;
      const session = sessionRef.current;
      const trimmed = String(text || "").trim();
      if (!chatId || !trimmed || !current) return;
      if (sessionRef.current !== session) return;
      if (trimmed.length > MESSAGE_LIMIT) {
        throw new Error(`Текст длиннее ${MESSAGE_LIMIT} символов`);
      }

      const localId = createLocalId();
      setChats((prev) =>
        chatReducer(prev, {
          type: "add-local",
          chatId,
          message: {
            id: localId,
            text: trimmed,
            outgoing: true,
            timestamp: Date.now(),
            status: "sending",
          },
        }),
      );

      const controller = new AbortController();
      inflightRef.current.add(controller);
      try {
        const result = await sendMessage(current, chatId, trimmed, controller.signal);
        if (sessionRef.current !== session || controller.signal.aborted) return;
        setChats((prev) =>
          chatReducer(prev, {
            type: "patch",
            chatId,
            messageId: localId,
            patch: {
              id: result?.idMessage ? String(result.idMessage) : localId,
              status: "sent",
            },
          }),
        );
      } catch (error) {
        if (error?.name === "AbortError" || sessionRef.current !== session) return;
        setChats((prev) =>
          chatReducer(prev, {
            type: "patch",
            chatId,
            messageId: localId,
            patch: {
              status: "error",
              error: error.message,
            },
          }),
        );
      } finally {
        inflightRef.current.delete(controller);
      }
    },
    [sessionRef],
  );

  const retryMessage = useCallback(
    async (message) => {
      const chatId = activeChatIdRef.current;
      if (!chatId || !message?.text) return;
      if (!credentialsRef.current || sessionRef.current == null) return;
      setChats((prev) => chatReducer(prev, { type: "remove", chatId, messageId: message.id }));
      await submitMessage(message.text, chatId);
    },
    [sessionRef, submitMessage],
  );

  const startChat = useCallback(
    async (raw) => {
      const current = credentialsRef.current;
      if (!current) throw new Error("Нет активной сессии");
      const recipient = parseRecipient(raw);
      if (recipient.error) throw new Error(recipient.error);

      const session = sessionRef.current;
      const controller = new AbortController();
      inflightRef.current.add(controller);
      try {
        const result = await checkAccount(current, recipient, controller.signal);
        if (sessionRef.current !== session || controller.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        if (!result?.exist || result.chatId == null || result.chatId === "") {
          throw new Error("Аккаунт Telegram не найден. Проверьте номер или @username");
        }

        const id = String(result.chatId);
        const phone = result.phoneNumber ? String(result.phoneNumber) : recipient.phone || "";
        const username = formatUsername(result.username || recipient.username || "");
        const title = username || formatPhone(phone) || id;
        if (sessionRef.current !== session) {
          throw new DOMException("Aborted", "AbortError");
        }

        setChats((prev) =>
          chatReducer(prev, {
            type: "upsert-opened",
            chat: { id, phone, username, title },
          }),
        );
        setActiveChatId(id);
      } catch (error) {
        if (error?.name === "AbortError" || sessionRef.current !== session) {
          throw new DOMException("Aborted", "AbortError");
        }
        throw error;
      } finally {
        inflightRef.current.delete(controller);
      }
    },
    [sessionRef],
  );

  return {
    chats,
    activeChatId,
    storageError,
    selectChat,
    applyNotification,
    startChat,
    submitMessage,
    retryMessage,
  };
};
