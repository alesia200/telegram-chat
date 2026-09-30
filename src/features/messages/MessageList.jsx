import { useEffect, useRef } from "react";
import { SCROLL_STICK_THRESHOLD_PX } from "../../shared/config/constants.js";
import { dayTitle } from "../../shared/lib/format.js";
import MessageBubble from "./MessageBubble.jsx";
import styles from "./MessageList.module.css";

const MessageList = ({ messages, chatId, onRetry }) => {
  const listRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    stickRef.current = true;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chatId]);

  useEffect(() => {
    const node = listRef.current;
    if (!node || !stickRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, chatId]);

  const onScroll = () => {
    const node = listRef.current;
    if (!node) return;
    stickRef.current =
      node.scrollHeight - node.scrollTop - node.clientHeight < SCROLL_STICK_THRESHOLD_PX;
  };

  return (
    <div className={styles.list} ref={listRef} onScroll={onScroll}>
      {messages.length === 0 && <p className={styles.empty}>Напишите первое сообщение</p>}
      {messages.map((message, index) => {
        const day = dayTitle(message.timestamp);
        const previousDay = index > 0 ? dayTitle(messages[index - 1].timestamp) : "";
        return (
          <div key={message.id} className={styles.block}>
            {day !== previousDay && <div className={styles.day}>{day}</div>}
            <MessageBubble message={message} onRetry={onRetry} />
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
