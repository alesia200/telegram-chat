import { formatClock } from "../../shared/lib/format.js";
import MessageStatus from "./MessageStatus.jsx";
import styles from "./MessageBubble.module.css";

const MessageBubble = ({ message, onRetry }) => {
  const direction = message.outgoing ? styles.out : styles.in;

  return (
    <div className={`${styles.row} ${direction}`}>
      <div className={`${styles.bubble} ${direction}`}>
        <p className={styles.text}>{message.text}</p>
        <span className={styles.meta}>
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatClock(message.timestamp)}
          </time>
          {message.outgoing && <MessageStatus status={message.status} />}
        </span>
      </div>
      {message.status === "error" && (
        <button type="button" className={styles.retry} onClick={() => onRetry(message)}>
          Не отправлено. Повторить
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
