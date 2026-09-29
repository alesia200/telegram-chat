import { avatarColor, initials } from "../format.js";

export default function Avatar({ id, title, size = 48 }) {
  return (
    <span
      className="avatar"
      style={{ background: avatarColor(id || title), width: size, height: size, fontSize: size < 40 ? 13 : 16 }}
      aria-hidden="true"
    >
      {initials(title)}
    </span>
  );
}
