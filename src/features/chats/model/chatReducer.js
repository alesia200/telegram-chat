import { formatPhone } from "../../../shared/lib/phone.js";

/**
 * @typedef {"sending" | "sent" | "delivered" | "error"} MessageStatus
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} text
 * @property {boolean} outgoing
 * @property {number} timestamp
 * @property {MessageStatus} [status]
 * @property {string} [error]
 */

/**
 * @typedef {Object} Chat
 * @property {string} id
 * @property {string} phone
 * @property {string} [username]
 * @property {string} title
 * @property {number} updatedAt
 * @property {Message[]} messages
 */

const STATUS_RANK = { sending: 0, sent: 1, delivered: 2 };

export function sortChats(chats) {
  return [...chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function replaceChat(chats, index, chat) {
  const next = chats.slice();
  next[index] = chat;
  return sortChats(next);
}

export function createChat({ id, phone, title, username }) {
  return {
    id,
    phone: phone || "",
    username: username || "",
    title: title || username || formatPhone(phone) || id,
    updatedAt: Date.now(),
    messages: [],
  };
}

export function ensureChat(chats, chat) {
  if (chats.some((item) => item.id === chat.id)) return chats;
  return sortChats([chat, ...chats]);
}

export function upsertOpenedChat(chats, chat) {
  const found = chats.find((item) => item.id === chat.id);
  if (!found) return ensureChat(chats, createChat(chat));
  return chats.map((item) =>
    item.id === chat.id
      ? {
          ...item,
          phone: item.phone || chat.phone,
          username: item.username || chat.username,
        }
      : item,
  );
}

function resolveTitle(chat, event) {
  const phoneTitle = formatPhone(chat.phone) || chat.phone;
  const hasName = event.title && event.title !== chat.id;
  const titleIsPlaceholder =
    !chat.title ||
    chat.title === phoneTitle ||
    chat.title === chat.phone ||
    chat.title === chat.username ||
    chat.title === chat.id;
  if (titleIsPlaceholder) {
    return (hasName && event.title) || phoneTitle || chat.title || chat.id;
  }
  return chat.title;
}

export function addLocalMessage(chats, chatId, message) {
  const index = chats.findIndex((chat) => chat.id === chatId);
  if (index === -1) return chats;
  const chat = chats[index];
  return replaceChat(chats, index, {
    ...chat,
    updatedAt: message.timestamp,
    messages: [...chat.messages, message],
  });
}

export function patchMessage(chats, chatId, messageId, patch) {
  const index = chats.findIndex((chat) => chat.id === chatId);
  if (index === -1) return chats;
  const chat = chats[index];
  let found = false;
  const messages = chat.messages.map((message) => {
    if (message.id !== messageId) return message;
    found = true;
    return { ...message, ...patch };
  });
  if (!found) return chats;
  return replaceChat(chats, index, { ...chat, messages });
}

export function removeMessage(chats, chatId, messageId) {
  const index = chats.findIndex((chat) => chat.id === chatId);
  if (index === -1) return chats;
  const chat = chats[index];
  return replaceChat(chats, index, {
    ...chat,
    messages: chat.messages.filter((message) => message.id !== messageId),
  });
}

export function applyMessageEvent(chats, event) {
  const message = {
    id: event.id,
    text: event.text,
    outgoing: event.outgoing,
    timestamp: event.timestamp,
    status: event.outgoing ? "sent" : undefined,
  };

  const index = chats.findIndex((chat) => chat.id === event.chatId);
  if (index === -1) {
    return sortChats([
      {
        id: event.chatId,
        phone: event.phone || "",
        title: event.title || formatPhone(event.phone) || event.chatId,
        updatedAt: event.timestamp,
        messages: [message],
      },
      ...chats,
    ]);
  }

  const chat = chats[index];
  if (chat.messages.some((item) => item.id === message.id)) return chats;

  if (event.outgoing) {
    const localIndex = chat.messages.findIndex(
      (item) =>
        item.outgoing &&
        item.status === "sending" &&
        String(item.id).startsWith("local-") &&
        item.text === event.text,
    );
    if (localIndex !== -1) {
      const messages = chat.messages.slice();
      messages[localIndex] = {
        ...messages[localIndex],
        id: message.id,
        status: "sent",
      };
      return replaceChat(chats, index, {
        ...chat,
        phone: chat.phone || event.phone || "",
        title: resolveTitle(chat, event),
        updatedAt: Math.max(chat.updatedAt || 0, event.timestamp),
        messages,
      });
    }
  }

  return replaceChat(chats, index, {
    ...chat,
    phone: chat.phone || event.phone || "",
    title: resolveTitle(chat, event),
    updatedAt: event.timestamp,
    messages: [...chat.messages, message],
  });
}

function mergeStatus(current, next) {
  if (next === "error") return "error";
  if (current === "error") return "error";
  if ((STATUS_RANK[next] ?? 0) < (STATUS_RANK[current] ?? 0)) return current;
  return next;
}

export function applyStatusEvent(chats, event) {
  if (!event.idMessage) return chats;
  let changed = false;
  const next = chats.map((chat) => {
    let chatChanged = false;
    const messages = chat.messages.map((message) => {
      if (message.id !== event.idMessage) return message;
      const status = mergeStatus(message.status, event.status);
      if (status === message.status && event.status !== "error") return message;
      chatChanged = true;
      changed = true;
      return {
        ...message,
        status,
        error: status === "error" ? event.error || "Не отправлено" : undefined,
      };
    });
    return chatChanged ? { ...chat, messages } : chat;
  });
  return changed ? next : chats;
}

export function chatReducer(chats, action) {
  switch (action.type) {
    case "ensure":
      return ensureChat(chats, action.chat);
    case "upsert-opened":
      return upsertOpenedChat(chats, action.chat);
    case "add-local":
      return addLocalMessage(chats, action.chatId, action.message);
    case "patch":
      return patchMessage(chats, action.chatId, action.messageId, action.patch);
    case "remove":
      return removeMessage(chats, action.chatId, action.messageId);
    case "message-event":
      return applyMessageEvent(chats, action.event);
    case "status-event":
      return applyStatusEvent(chats, action.event);
    default:
      return chats;
  }
}
