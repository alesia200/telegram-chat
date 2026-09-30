import { avatarColor, initials } from "../lib/format.js";
import styles from "./Avatar.module.css";

const Avatar = ({ id, title, size = 48 }) => {
  return (
    <span
      className={styles.avatar}
      style={{
        background: avatarColor(id || title),
        width: size,
        height: size,
        fontSize: size < 40 ? 13 : 16,
      }}
      aria-hidden="true"
    >
      {initials(title)}
    </span>
  );
};

export default Avatar;
