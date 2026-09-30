import { formatPhone } from "../../shared/lib/phone.js";
import Avatar from "../../shared/ui/Avatar.jsx";
import styles from "./ConversationHeader.module.css";

function chatCaption(chat) {
  const phone = formatPhone(chat.phone);
  const username = chat.username || "";
  if (chat.title === username && phone) return phone;
  if (chat.title === phone && username) return username;
  if (phone && username) return `${username} · ${phone}`;
  return phone || username || "личный чат";
}

const ConversationHeader = ({ chat, onBack }) => {
  return (
    <header className={styles.head}>
      <button type="button" className={styles.back} onClick={onBack} aria-label="К списку чатов">
        ←
      </button>
      <Avatar id={chat.id} title={chat.title} size={42} />
      <div className={styles.title}>
        <strong>{chat.title}</strong>
        <span>{chatCaption(chat)}</span>
      </div>
    </header>
  );
};

export default ConversationHeader;
