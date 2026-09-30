import { useCallback, useRef, useState } from "react";
import { getStateInstance } from "../../shared/api/greenApiClient.js";
import { clearCredentials, loadCredentials, saveCredentials } from "../../shared/lib/storage.js";
import { LOGIN_BLOCK } from "./instanceMessages.js";
import { normalizeLoginForm, validateLoginForm } from "./validateLogin.js";

export const useAuth = () => {
  const [credentials, setCredentials] = useState(() => loadCredentials());
  const [instanceState, setInstanceState] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [credentialStorageError, setCredentialStorageError] = useState("");
  const sessionRef = useRef(credentials ? 1 : 0);
  const [sessionId, setSessionId] = useState(sessionRef.current);
  const loginAbortRef = useRef(null);

  const logout = useCallback(() => {
    loginAbortRef.current?.abort();
    sessionRef.current += 1;
    setSessionId(sessionRef.current);
    clearCredentials();
    setCredentials(null);
    setInstanceState("");
    setLoginError("");
    setLoginPending(false);
    setCredentialStorageError("");
  }, []);

  const login = useCallback(async (form) => {
    const validationError = validateLoginForm(form, import.meta.env.DEV);
    if (validationError) {
      setLoginError(validationError);
      return;
    }

    const next = normalizeLoginForm(form);
    loginAbortRef.current?.abort();
    const controller = new AbortController();
    loginAbortRef.current = controller;
    const session = sessionRef.current;

    setLoginPending(true);
    setLoginError("");

    try {
      const data = await getStateInstance(next, controller.signal);
      if (sessionRef.current !== session || controller.signal.aborted) return;
      const state = data?.stateInstance || "";
      if (LOGIN_BLOCK[state]) {
        setLoginError(LOGIN_BLOCK[state]);
        return;
      }
      const saved = saveCredentials(next);
      sessionRef.current += 1;
      setSessionId(sessionRef.current);
      setCredentialStorageError(saved.ok ? "" : saved.message);
      setCredentials(next);
      setInstanceState(state);
    } catch (error) {
      if (error?.name === "AbortError" || sessionRef.current !== session) return;
      setLoginError(error.message);
    } finally {
      if (loginAbortRef.current === controller) setLoginPending(false);
    }
  }, []);

  return {
    credentials,
    sessionId,
    sessionRef,
    instanceState,
    setInstanceState,
    loginError,
    loginPending,
    credentialStorageError,
    login,
    logout,
  };
};
