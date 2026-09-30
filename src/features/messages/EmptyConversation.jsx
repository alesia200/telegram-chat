import buttons from "../../shared/ui/buttons.module.css";
import Logo from "../../shared/ui/Logo.jsx";
import styles from "./EmptyConversation.module.css";

const EmptyConversation = ({ onOpenModal }) => {
  return (
    <div className={styles.empty}>
      <Logo size={72} />
      <h2>Выберите чат</h2>
      <p>Укажите номер или @username и напишите текстовое сообщение.</p>
      <button type="button" className={buttons.primary} onClick={onOpenModal}>
        Новый чат
      </button>
    </div>
  );
};

export default EmptyConversation;
