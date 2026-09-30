import { useCallback, useState } from "react";
import { MESSAGE_LIMIT } from "../../shared/config/constants.js";
import ChatSidebar from "../chats/ChatSidebar.jsx";
import NewChatModal from "../chats/NewChatModal.jsx";
import Conversation from "./Conversation.jsx";
import styles from "./Messenger.module.css";

const Messenger = ({
  idInstance,
  chats,
  activeChatId,
  instanceState,
  warning,
  pollError,
  storageError,
  onSelectChat,
  onLogout,
  onStartChat,
  onSend,
  onRetry,
}) => {
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalPending, setModalPending] = useState(false);
  const [sendError, setSendError] = useState("");

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;
  const draft = activeChatId ? drafts[activeChatId] || "" : "";

  const openModal = useCallback(() => {
    setModalError("");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const createChat = async (phone) => {
    if (modalPending) return;
    setModalPending(true);
    setModalError("");
    try {
      await onStartChat(phone);
      setModalOpen(false);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setModalError(error.message);
    } finally {
      setModalPending(false);
    }
  };

  const changeDraft = (value) => {
    if (!activeChatId) return;
    setSendError("");
    setDrafts((prev) => ({ ...prev, [activeChatId]: value }));
  };

  const submitDraft = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MESSAGE_LIMIT) return;
    setDrafts((prev) => ({ ...prev, [activeChatId]: "" }));
    setSendError("");
    try {
      await onSend(text);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setSendError(error.message);
      setDrafts((prev) => ({ ...prev, [activeChatId]: text }));
    }
  };

  const notices = [
    warning ? { id: "warning", tone: styles.warn, text: warning } : null,
    pollError ? { id: "poll", tone: styles.bad, text: pollError } : null,
    storageError ? { id: "storage", tone: styles.bad, text: storageError } : null,
  ].filter(Boolean);

  return (
    <div className={styles.app}>
      {notices.length > 0 && (
        <div className={styles.alerts} aria-live="polite">
          {notices.map((notice) => (
            <p key={notice.id} className={`${styles.alert} ${notice.tone}`} role="alert">
              {notice.text}
            </p>
          ))}
        </div>
      )}
      <div className={`${styles.shell} ${activeChat ? styles.chatOpen : ""}`}>
        <ChatSidebar
          className={styles.sidebarSlot}
          idInstance={idInstance}
          chats={chats}
          activeChatId={activeChatId}
          query={query}
          onQueryChange={setQuery}
          instanceState={instanceState}
          pollError={pollError}
          onSelectChat={onSelectChat}
          onLogout={onLogout}
          onOpenModal={openModal}
        />
        <Conversation
          className={styles.conversationSlot}
          chat={activeChat}
          draft={draft}
          sendError={sendError}
          onDraftChange={changeDraft}
          onSend={submitDraft}
          onRetry={onRetry}
          onBack={() => onSelectChat(null)}
          onOpenModal={openModal}
        />
      </div>
      {modalOpen && (
        <NewChatModal
          pending={modalPending}
          error={modalError}
          onClose={closeModal}
          onSubmit={createChat}
        />
      )}
    </div>
  );
};

export default Messenger;
