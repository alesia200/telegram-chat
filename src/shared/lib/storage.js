import {
  CHATS_STORAGE_PREFIX,
  CREDENTIALS_STORAGE_KEY,
  MAX_STORED_MESSAGES,
} from "../config/constants.js";

/**
 * Учебный frontend-only клиент хранит apiTokenInstance в localStorage.
 * Любой скрипт страницы может прочитать токен, поэтому XSS раскрывает доступ к инстансу.
 * Для production токен должен оставаться на backend/BFF и не попадать в браузер:
 * Frontend -> Backend/BFF -> GREEN-API.
 */

function chatsKey(idInstance) {
  return `${CHATS_STORAGE_PREFIX}${idInstance}`;
}

export function loadCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.apiUrl || !data?.idInstance || !data?.apiTokenInstance) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials) {
  try {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
    return { ok: true };
  } catch {
    return { ok: false, message: "Не удалось сохранить данные входа в браузере." };
  }
}

export function clearCredentials() {
  try {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  } catch {
    // Сессия в памяти всё равно завершается, даже если браузер запретил запись.
  }
}

export function loadChats(idInstance) {
  try {
    const raw = JSON.parse(localStorage.getItem(chatsKey(idInstance)) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages),
    );
  } catch {
    return [];
  }
}

export function saveChats(idInstance, chats) {
  const trimmed = chats.map((chat) => ({
    ...chat,
    messages: chat.messages.slice(-MAX_STORED_MESSAGES),
  }));
  try {
    localStorage.setItem(chatsKey(idInstance), JSON.stringify(trimmed));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Не удалось сохранить историю чатов. Сообщения останутся только до обновления страницы.",
    };
  }
}
