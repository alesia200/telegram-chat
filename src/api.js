export const DEFAULT_API_URL = "https://4100.api.green-api.com";
export const MESSAGE_LIMIT = 4096;

function endpoint(credentials, method, suffix = "") {
  const base = String(credentials.apiUrl || "").replace(/\/+$/, "");
  const id = encodeURIComponent(credentials.idInstance);
  const token = encodeURIComponent(credentials.apiTokenInstance);
  return `${base}/waInstance${id}/${method}/${token}${suffix}`;
}

function errorText(data, status) {
  if (!data) return `Ошибка ${status}`;
  if (typeof data === "string") return data;
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.error === "string" && data.error) return data.error;
  if (typeof data.reason === "string" && data.reason) return data.reason;
  return `Ошибка ${status}`;
}

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body,
      signal: options.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("Не удалось связаться с GREEN-API. Проверьте apiUrl и подключение к сети.");
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(errorText(data, response.status));
  }

  return data;
}

function humanizeReason(reason) {
  if (!reason) return "Не удалось проверить номер";
  if (/not authorized|starting/i.test(reason)) {
    return "Инстанс не авторизован или ещё запускается";
  }
  if (/temporarily unavailable/i.test(reason)) {
    return "Серверы Telegram временно недоступны. Повторите через несколько минут";
  }
  if (/limit/i.test(reason)) {
    return "Слишком много проверок. Подождите и повторите позже";
  }
  return reason;
}

export function getStateInstance(credentials, signal) {
  return request(endpoint(credentials, "getStateInstance"), { signal });
}

export async function checkAccount(credentials, recipient) {
  const body = recipient.username
    ? { username: recipient.username }
    : { phoneNumber: Number(recipient.phone) };
  const data = await request(endpoint(credentials, "checkAccount"), {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data && data.status === false) {
    throw new Error(humanizeReason(data.reason || data.data?.reason));
  }
  return data;
}

export function sendMessage(credentials, chatId, message) {
  return request(endpoint(credentials, "sendMessage"), {
    method: "POST",
    body: JSON.stringify({ chatId, message }),
  });
}

export function receiveNotification(credentials, timeout = 20, signal) {
  const seconds = Math.min(60, Math.max(5, timeout));
  return request(endpoint(credentials, "receiveNotification", `?receiveTimeout=${seconds}`), {
    signal,
  });
}

export function deleteNotification(credentials, receiptId, signal) {
  return request(endpoint(credentials, "deleteNotification", `/${encodeURIComponent(receiptId)}`), {
    method: "DELETE",
    signal,
  });
}
