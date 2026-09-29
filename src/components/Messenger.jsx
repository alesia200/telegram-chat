import { useEffect, useRef, useState } from "react";
import { MESSAGE_LIMIT } from "../api.js";
import { dayTitle, formatClock, formatListTime, previewText } from "../format.js";
import { formatPhone } from "../phone.js";
import Avatar from "./Avatar.jsx";
import { Logo, SearchIcon, SendIcon } from "./Icons.jsx";

function chatCaption(chat) {
  const phone = formatPhone(chat.phone);
  const username = chat.username || "";
  if (chat.title === username && phone) return phone;
  if (chat.title === phone && username) return username;
  if (phone && username) return `${username} · ${phone}`;
  return phone || username || "личный чат";
}

function StatusMark({ status }) {
  if (status === "sending") return <span className="ticks">…</span>;
  if (status === "error") return null;
  if (status === "delivered") {
    return (
      <span className="ticks" aria-label="Доставлено">
        ✓✓
      </span>
    );
  }
  return (
    <span className="ticks" aria-label="Отправлено">
      ✓
    </span>
  );
}

export default function Messenger({
  idInstance,
  chats,
  activeChatId,
  instanceState,
  warning,
  pollError,
  onSelectChat,
  onLogout,
  onStartChat,
  onSend,
  onRetry,
}) {
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalPending, setModalPending] = useState(false);
  const [sendError, setSendError] = useState("");
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const inputRef = useRef(null);
  const phoneRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;
  const draft = activeChatId ? drafts[activeChatId] || "" : "";
  const normalizedQuery = query.trim().toLowerCase();
  const visibleChats = chats.filter((chat) => {
    if (!normalizedQuery) return true;
    const last = chat.messages[chat.messages.length - 1];
    return [chat.title, chat.phone, chat.username, formatPhone(chat.phone), last?.text]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  useEffect(() => {
    stickRef.current = true;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [activeChatId]);

  useEffect(() => {
    const node = listRef.current;
    if (!node || !stickRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [activeChat?.messages.length, activeChatId]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    phoneRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape" && !modalPending) setModalOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, modalPending]);

  useEffect(() => {
    if (activeChatId) inputRef.current?.focus();
  }, [activeChatId]);

  function setDraft(value) {
    if (!activeChatId) return;
    setDrafts((prev) => ({ ...prev, [activeChatId]: value }));
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
  }

  function openModal() {
    setPhone("");
    setModalError("");
    setModalOpen(true);
  }

  async function createChat(event) {
    event.preventDefault();
    if (modalPending) return;
    setModalPending(true);
    setModalError("");
    try {
      await onStartChat(phone);
      setModalOpen(false);
      setPhone("");
    } catch (error) {
      setModalError(error.message);
    } finally {
      setModalPending(false);
    }
  }

  async function submit(event) {
    event?.preventDefault();
    const text = draft;
    if (!text.trim() || text.trim().length > MESSAGE_LIMIT) return;
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setSendError("");
    try {
      await onSend(text);
    } catch (error) {
      setSendError(error.message);
      setDraft(text);
    }
  }

  function onMessagesScroll() {
    const node = listRef.current;
    if (!node) return;
    stickRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  }

  const online = instanceState === "authorized" && !pollError;
  let dayCursor = "";

  return (
    <div className="app">
      {(warning || pollError) && (
        <div className="alerts">
          {warning && <p className="alert warn">{warning}</p>}
          {pollError && <p className="alert bad">{pollError}</p>}
        </div>
      )}
      <div className={`shell ${activeChat ? "chat-open" : ""}`}>
      <aside className="sidebar">
        <header className="sidebar-head">
          <div className="brand-lockup">
            <Logo size={36} />
            <div>
              <strong>Чаты</strong>
              <span className={`presence ${online ? "on" : pollError ? "off" : ""}`}>
                {pollError ? "нет входящих" : instanceState === "authorized" ? "авторизован" : instanceState || "подключение"}
              </span>
            </div>
          </div>
          <button type="button" className="compose" onClick={openModal} title="Новый чат">
            Новый
          </button>
        </header>

        <label className="search">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск"
            aria-label="Поиск по чатам"
          />
        </label>

        <div className="chat-list">
          {visibleChats.length === 0 && (
            <div className="list-empty">
              <p>{chats.length === 0 ? "Чатов пока нет" : "Ничего не найдено"}</p>
            </div>
          )}
          {visibleChats.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            return (
              <button
                type="button"
                key={chat.id}
                className={`chat-row ${chat.id === activeChatId ? "active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <Avatar id={chat.id} title={chat.title} />
                <span className="chat-row-body">
                  <span className="chat-row-top">
                    <span className="chat-name">{chat.title}</span>
                    <time>{last ? formatListTime(last.timestamp) : ""}</time>
                  </span>
                  <span className="chat-preview">
                    {last ? `${last.outgoing ? "Вы: " : ""}${previewText(last.text)}` : "Нет сообщений"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <footer className="sidebar-foot">
          <span>Инстанс {idInstance}</span>
          <button type="button" className="ghost" onClick={onLogout}>
            Выйти
          </button>
        </footer>
      </aside>

      <section className="conversation">
        {!activeChat && (
          <div className="stage-empty">
            <Logo size={72} />
            <h2>Выберите чат</h2>
            <p>Укажите номер или @username и напишите текстовое сообщение.</p>
            <button type="button" className="primary" onClick={openModal}>
              Новый чат
            </button>
          </div>
        )}

        {activeChat && (
          <>
            <header className="conv-head">
              <button type="button" className="back" onClick={() => onSelectChat(null)} aria-label="К списку чатов">
                ←
              </button>
              <Avatar id={activeChat.id} title={activeChat.title} size={42} />
              <div className="conv-title">
                <strong>{activeChat.title}</strong>
                <span>{chatCaption(activeChat)}</span>
              </div>
            </header>

            <div className="messages" ref={listRef} onScroll={onMessagesScroll}>
              {activeChat.messages.length === 0 && (
                <p className="thread-empty">Напишите первое сообщение</p>
              )}
              {activeChat.messages.map((message) => {
                const day = dayTitle(message.timestamp);
                const showDay = day !== dayCursor;
                dayCursor = day;
                return (
                  <div key={message.id} className="message-block">
                    {showDay && <div className="day">{day}</div>}
                    <div className={`row ${message.outgoing ? "out" : "in"}`}>
                      <div className={`bubble ${message.outgoing ? "out" : "in"}`}>
                        <p className="bubble-text">{message.text}</p>
                        <span className="bubble-meta">
                          <time>{formatClock(message.timestamp)}</time>
                          {message.outgoing && <StatusMark status={message.status} />}
                        </span>
                      </div>
                      {message.status === "error" && (
                        <button type="button" className="retry" onClick={() => onRetry(message)}>
                          Не отправлено. Повторить
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form className="composer" onSubmit={submit}>
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                placeholder="Сообщение"
                aria-label="Текст сообщения"
                onChange={(event) => {
                  setSendError("");
                  setDraft(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              {draft.length > MESSAGE_LIMIT - 400 && (
                <span className={`counter ${draft.length > MESSAGE_LIMIT ? "over" : ""}`}>
                  {draft.length}/{MESSAGE_LIMIT}
                </span>
              )}
              <button className="send" type="submit" disabled={!draft.trim() || draft.trim().length > MESSAGE_LIMIT} aria-label="Отправить">
                <SendIcon />
              </button>
            </form>
            {sendError && <p className="composer-error">{sendError}</p>}
          </>
        )}
      </section>
      </div>

      {modalOpen && (
        <div className="overlay" onMouseDown={() => !modalPending && setModalOpen(false)}>
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-chat-title"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={createChat}
          >
            <h2 id="new-chat-title">Новый чат</h2>
            <p>Номер телефона в международном формате или @username.</p>
            <label>
              <span>Телефон</span>
              <input
                ref={phoneRef}
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="79991234567 или @username"
                autoComplete="off"
                required
              />
            </label>
            {modalError && (
              <p className="form-error" role="alert">
                {modalError}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setModalOpen(false)} disabled={modalPending}>
                Отмена
              </button>
              <button className="primary" type="submit" disabled={modalPending}>
                {modalPending ? "Проверка..." : "Создать"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
