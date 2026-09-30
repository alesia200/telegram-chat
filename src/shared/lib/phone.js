export function normalizePhone(input) {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`;
  }
  return digits;
}

const USERNAME = /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export function formatUsername(value) {
  if (!value) return "";
  const name = String(value).trim();
  return name.startsWith("@") ? name : `@${name}`;
}

export function parseRecipient(input) {
  const raw = String(input || "").trim();
  if (!raw) return { error: "Введите номер телефона или @username" };

  if (raw.startsWith("@") || /[a-zA-Z_]/.test(raw)) {
    const username = formatUsername(raw);
    if (!USERNAME.test(username)) {
      return { error: "Username: 5–32 символа, латиница, цифры и _" };
    }
    return { username };
  }

  const phone = normalizePhone(raw);
  if (!/^\d{8,15}$/.test(phone)) {
    return { error: "Введите номер в международном формате, например 79991234567" };
  }
  return { phone };
}

export function formatPhone(digits) {
  if (/^7\d{10}$/.test(digits)) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  if (/^375\d{9}$/.test(digits)) {
    return `+375 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
  }
  return digits ? `+${digits}` : "";
}
