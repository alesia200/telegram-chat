import ConversationHeader from "./ConversationHeader.jsx";
import EmptyConversation from "./EmptyConversation.jsx";
import MessageComposer from "./MessageComposer.jsx";
import MessageList from "./MessageList.jsx";
import styles from "./Conversation.module.css";

const Conversation = ({
  className,
  chat,
  draft,
  sendError,
  onDraftChange,
  onSend,
  onRetry,
  onBack,
  onOpenModal,
}) => {
  return (
    <section className={`${styles.conversation} ${className || ""}`}>
      {!chat && <EmptyConversation onOpenModal={onOpenModal} />}
      {chat && (
        <>
          <ConversationHeader chat={chat} onBack={onBack} />
          <MessageList messages={chat.messages} chatId={chat.id} onRetry={onRetry} />
          <MessageComposer
            chatId={chat.id}
            draft={draft}
            sendError={sendError}
            onDraftChange={onDraftChange}
            onSend={onSend}
          />
        </>
      )}
    </section>
  );
};

export default Conversation;
