import styles from "./MessageStatus.module.css";

const MessageStatus = ({ status }) => {
  if (status === "sending") {
    return (
      <span className={styles.ticks} aria-label="Отправляется">
        …
      </span>
    );
  }
  if (status === "error") return null;
  if (status === "delivered") {
    return (
      <span className={styles.ticks} aria-label="Доставлено">
        ✓✓
      </span>
    );
  }
  return (
    <span className={styles.ticks} aria-label="Отправлено">
      ✓
    </span>
  );
};

export default MessageStatus;
