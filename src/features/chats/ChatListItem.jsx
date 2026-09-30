import { formatListTime, previewText } from "../../shared/lib/format.js";
import Avatar from "../../shared/ui/Avatar.jsx";
import styles from "./ChatListItem.module.css";

const ChatListItem = ({ chat, active, onSelect }) => {
  const last = chat.messages[chat.messages.length - 1];
  const preview = last
    ? `${last.outgoing ? "Вы: " : ""}${previewText(last.text)}`
    : "Нет сообщений";

  return (
    <button
      type="button"
      className={`${styles.row} ${active ? styles.active : ""}`}
      onClick={() => onSelect(chat.id)}
      aria-current={active ? "true" : undefined}
    >
      <Avatar id={chat.id} title={chat.title} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.name}>{chat.title}</span>
          <time className={styles.time}>{last ? formatListTime(last.timestamp) : ""}</time>
        </span>
        <span className={styles.preview}>{preview}</span>
      </span>
    </button>
  );
};

export default ChatListItem;
