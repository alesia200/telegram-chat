import { isSecureApiUrl } from "../../shared/api/apiUrl.js";

export function validateLoginForm(form, allowInsecureLocalhost) {
  const apiUrl = String(form?.apiUrl || "")
    .trim()
    .replace(/\/+$/, "");
  const idInstance = String(form?.idInstance || "").trim();
  const apiTokenInstance = String(form?.apiTokenInstance || "").trim();

  if (!isSecureApiUrl(apiUrl, allowInsecureLocalhost)) {
    if (/^http:\/\//i.test(apiUrl)) {
      return "apiUrl должен использовать HTTPS. Токен инстанса нельзя отправлять по обычному HTTP.";
    }
    return "Укажите apiUrl из личного кабинета, например https://4100.api.green-api.com";
  }
  if (!/^\d+$/.test(idInstance)) {
    return "idInstance должен состоять из цифр";
  }
  if (!apiTokenInstance) {
    return "Введите apiTokenInstance";
  }
  return "";
}

export function normalizeLoginForm(form) {
  return {
    apiUrl: String(form.apiUrl || "")
      .trim()
      .replace(/\/+$/, ""),
    idInstance: String(form.idInstance || "").trim(),
    apiTokenInstance: String(form.apiTokenInstance || "").trim(),
  };
}
