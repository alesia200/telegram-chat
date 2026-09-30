export const LOGIN_BLOCK = {
  notAuthorized:
    "Инстанс не авторизован. Авторизуйте инстанс Telegram в личном кабинете GREEN-API.",
  blocked: "Аккаунт Telegram заблокирован.",
  starting: "Инстанс запускается. Подождите несколько минут и войдите снова.",
  pendingPassword:
    "Чтобы закончить авторизацию, укажите пароль двухфакторной аутентификации в личном кабинете.",
};

export function instanceWarning(instanceState) {
  if (LOGIN_BLOCK[instanceState]) return LOGIN_BLOCK[instanceState];
  if (instanceState === "suspended") {
    return "На аккаунте временные ограничения: сообщения уходят только тем, кто сохранил ваш номер в контактах.";
  }
  return "";
}
