import { useEffect, useRef } from "react";
import {
  COMPOSER_COUNTER_OFFSET,
  MESSAGE_LIMIT,
  TEXTAREA_MAX_HEIGHT_PX,
} from "../../shared/config/constants.js";
import SendIcon from "../../shared/ui/SendIcon.jsx";
import styles from "./MessageComposer.module.css";

const MessageComposer = ({ chatId, draft, sendError, onDraftChange, onSend }) => {
  const inputRef = useRef(null);
  const trimmed = draft.trim();
  const tooLong = trimmed.length > MESSAGE_LIMIT;
  const showCounter = draft.length > MESSAGE_LIMIT - COMPOSER_COUNTER_OFFSET;

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatId]);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, [draft, chatId]);

  const submit = (event) => {
    event?.preventDefault();
    if (!trimmed || tooLong) return;
    onSend(draft);
  };

  return (
    <>
      <form className={styles.composer} onSubmit={submit}>
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          placeholder="Сообщение"
          aria-label="Текст сообщения"
          aria-invalid={tooLong || undefined}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {showCounter && (
          <span className={`${styles.counter} ${tooLong ? styles.over : ""}`}>
            {draft.length}/{MESSAGE_LIMIT}
          </span>
        )}
        <button
          className={styles.send}
          type="submit"
          disabled={!trimmed || tooLong}
          aria-label="Отправить"
        >
          <SendIcon />
        </button>
      </form>
      {sendError && (
        <p className={styles.error} role="alert">
          {sendError}
        </p>
      )}
    </>
  );
};

export default MessageComposer;
