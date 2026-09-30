import { useState } from "react";
import { DEFAULT_API_URL } from "../../shared/config/constants.js";
import buttons from "../../shared/ui/buttons.module.css";
import Logo from "../../shared/ui/Logo.jsx";
import styles from "./LoginScreen.module.css";

const LoginScreen = ({ onSubmit, pending, error }) => {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pending) return;
    onSubmit({ apiUrl, idInstance, apiTokenInstance });
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <Logo size={56} />
          <div>
            <h1>Telegram</h1>
            <p>Текстовые сообщения через GREEN-API</p>
          </div>
        </div>

        <label className={styles.field} htmlFor="api-url">
          <span>apiUrl</span>
          <input
            id="api-url"
            name="apiUrl"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="https://4100.api.green-api.com"
            autoComplete="off"
            spellCheck="false"
            required
          />
        </label>

        <label className={styles.field} htmlFor="id-instance">
          <span>idInstance</span>
          <input
            id="id-instance"
            name="idInstance"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
            required
          />
        </label>

        <label className={styles.field} htmlFor="api-token">
          <span>apiTokenInstance</span>
          <span className={styles.tokenField}>
            <input
              id="api-token"
              name="apiTokenInstance"
              type={showToken ? "text" : "password"}
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              autoComplete="off"
              spellCheck="false"
              required
            />
            <button
              type="button"
              className={buttons.ghost}
              onClick={() => setShowToken((value) => !value)}
            >
              {showToken ? "Скрыть" : "Показать"}
            </button>
          </span>
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={buttons.primary} type="submit" disabled={pending}>
          {pending ? "Проверка инстанса..." : "Войти"}
        </button>
        <p className={styles.note}>
          Данные инстанса берутся в личном кабинете GREEN-API и сохраняются только в этом браузере.
          Токен доступен скриптам этой страницы: для production его нужно хранить на сервере.
        </p>
      </form>
    </div>
  );
};

export default LoginScreen;
