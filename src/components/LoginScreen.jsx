import { useState } from "react";
import { DEFAULT_API_URL } from "../api.js";
import { Logo } from "./Icons.jsx";

export default function LoginScreen({ onSubmit, pending, error }) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [showToken, setShowToken] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    onSubmit({ apiUrl, idInstance, apiTokenInstance });
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <Logo size={56} />
          <div>
            <h1>Telegram</h1>
            <p>Текстовые сообщения через GREEN-API</p>
          </div>
        </div>

        <label>
          <span>apiUrl</span>
          <input
            name="apiUrl"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="https://4100.api.green-api.com"
            autoComplete="off"
            spellCheck="false"
            required
          />
        </label>

        <label>
          <span>idInstance</span>
          <input
            name="idInstance"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
            required
          />
        </label>

        <label>
          <span>apiTokenInstance</span>
          <span className="token-field">
            <input
              name="apiTokenInstance"
              type={showToken ? "text" : "password"}
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              autoComplete="off"
              spellCheck="false"
              required
            />
            <button type="button" className="ghost" onClick={() => setShowToken((value) => !value)}>
              {showToken ? "Скрыть" : "Показать"}
            </button>
          </span>
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary" type="submit" disabled={pending}>
          {pending ? "Проверка инстанса..." : "Войти"}
        </button>
        <p className="login-note">
          Данные инстанса берутся в личном кабинете GREEN-API и сохраняются только в этом браузере.
        </p>
      </form>
    </div>
  );
}
