import { RECEIVE_TIMEOUT_MAX_SECONDS, RECEIVE_TIMEOUT_MIN_SECONDS } from "../config/constants.js";
import { isSecureApiUrl } from "./apiUrl.js";

const INSECURE_URL_ERROR =
  "apiUrl должен использовать HTTPS. Токен инстанса нельзя отправлять по обычному HTTP.";

function assertSecureApiUrl(apiUrl) {
  if (!isSecureApiUrl(apiUrl, import.meta.env.DEV)) {
    throw new Error(INSECURE_URL_ERROR);
  }
}

function endpoint(credentials, method, suffix = "") {
  const base = String(credentials.apiUrl || "").replace(/\/+$/, "");
  assertSecureApiUrl(base);
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

export async function getStateInstance(credentials, signal) {
  return request(endpoint(credentials, "getStateInstance"), { signal });
}

export async function checkAccount(credentials, recipient, signal) {
  const body = recipient.username
    ? { username: recipient.username }
    : { phoneNumber: Number(recipient.phone) };
  const data = await request(endpoint(credentials, "checkAccount"), {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
  if (data && data.status === false) {
    throw new Error(humanizeReason(data.reason || data.data?.reason));
  }
  return data;
}

export async function sendMessage(credentials, chatId, message, signal) {
  return request(endpoint(credentials, "sendMessage"), {
    method: "POST",
    body: JSON.stringify({ chatId, message }),
    signal,
  });
}

export async function receiveNotification(credentials, timeout, signal) {
  const seconds = Math.min(
    RECEIVE_TIMEOUT_MAX_SECONDS,
    Math.max(RECEIVE_TIMEOUT_MIN_SECONDS, timeout),
  );
  return request(endpoint(credentials, "receiveNotification", `?receiveTimeout=${seconds}`), {
    signal,
  });
}

export async function deleteNotification(credentials, receiptId, signal) {
  return request(endpoint(credentials, "deleteNotification", `/${encodeURIComponent(receiptId)}`), {
    method: "DELETE",
    signal,
  });
}
