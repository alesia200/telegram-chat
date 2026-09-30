import buttons from "../../shared/ui/buttons.module.css";
import Logo from "../../shared/ui/Logo.jsx";
import SearchIcon from "../../shared/ui/SearchIcon.jsx";
import ChatList from "./ChatList.jsx";
import styles from "./ChatSidebar.module.css";

const ChatSidebar = ({
  className,
  idInstance,
  chats,
  activeChatId,
  query,
  onQueryChange,
  instanceState,
  pollError,
  onSelectChat,
  onLogout,
  onOpenModal,
}) => {
  const online = instanceState === "authorized" && !pollError;
  const presence = pollError
    ? "нет входящих"
    : instanceState === "authorized"
      ? "авторизован"
      : instanceState || "подключение";

  return (
    <aside className={`${styles.sidebar} ${className || ""}`}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <Logo size={36} />
          <div>
            <strong>Чаты</strong>
            <span
              className={`${styles.presence} ${pollError ? styles.off : ""} ${online ? styles.on : ""}`}
            >
              {presence}
            </span>
          </div>
        </div>
        <button type="button" className={styles.compose} onClick={onOpenModal} title="Новый чат">
          Новый
        </button>
      </header>

      <label className={styles.search}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск"
          aria-label="Поиск по чатам"
        />
      </label>

      <ChatList chats={chats} query={query} activeChatId={activeChatId} onSelect={onSelectChat} />

      <footer className={styles.foot}>
        <span>Инстанс {idInstance}</span>
        <button type="button" className={buttons.ghost} onClick={onLogout}>
          Выйти
        </button>
      </footer>
    </aside>
  );
};

export default ChatSidebar;
