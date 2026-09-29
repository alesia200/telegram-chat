const CREDS_KEY = "telegram-chat-credentials";

function chatsKey(idInstance) {
  return `telegram-chat-chats:${idInstance}`;
}

export function loadCredentials() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.apiUrl || !data?.idInstance || !data?.apiTokenInstance) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(credentials));
}

export function clearCredentials() {
  localStorage.removeItem(CREDS_KEY);
}

export function loadChats(idInstance) {
  try {
    const raw = JSON.parse(localStorage.getItem(chatsKey(idInstance)) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages));
  } catch {
    return [];
  }
}

export function saveChats(idInstance, chats) {
  const trimmed = chats.map((chat) => ({
    ...chat,
    messages: chat.messages.slice(-300),
  }));
  try {
    localStorage.setItem(chatsKey(idInstance), JSON.stringify(trimmed));
  } catch {
    // История останется до обновления страницы, если хранилище переполнено.
  }
}
