import { formatPhone } from "../../shared/lib/phone.js";
import ChatListItem from "./ChatListItem.jsx";
import styles from "./ChatList.module.css";

function matchesQuery(chat, normalizedQuery) {
  if (!normalizedQuery) return true;
  const last = chat.messages[chat.messages.length - 1];
  return [chat.title, chat.phone, chat.username, formatPhone(chat.phone), last?.text]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

const ChatList = ({ chats, query, activeChatId, onSelect }) => {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleChats = chats.filter((chat) => matchesQuery(chat, normalizedQuery));

  return (
    <div className={styles.list}>
      {visibleChats.length === 0 && (
        <div className={styles.empty}>
          <p>{chats.length === 0 ? "Чатов пока нет" : "Ничего не найдено"}</p>
        </div>
      )}
      {visibleChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          active={chat.id === activeChatId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default ChatList;
