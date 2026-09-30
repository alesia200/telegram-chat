import { useEffect, useId, useRef } from "react";
import buttons from "../../shared/ui/buttons.module.css";
import styles from "./NewChatModal.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const NewChatModal = ({ pending, error, onClose, onSubmit }) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const pendingRef = useRef(pending);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    inputRef.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        if (pendingRef.current) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const items = [...root.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const previous = previousFocusRef.current;
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    const phone = new FormData(event.currentTarget).get("recipient");
    await onSubmit(String(phone || ""));
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={() => {
        if (!pending) onClose();
      }}
    >
      <form
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id={titleId}>Новый чат</h2>
        <p id={descriptionId}>Номер телефона в международном формате или @username.</p>
        <label className={styles.field} htmlFor="new-chat-recipient">
          <span>Телефон или @username</span>
          <input
            ref={inputRef}
            id="new-chat-recipient"
            name="recipient"
            type="text"
            placeholder="79991234567 или @username"
            autoComplete="off"
            required
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={buttons.ghost} onClick={onClose} disabled={pending}>
            Отмена
          </button>
          <button className={buttons.primary} type="submit" disabled={pending}>
            {pending ? "Проверка..." : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewChatModal;
