export function Logo({ size = 48 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#3390ec" />
      <path
        fill="#fff"
        d="M11.2 23.4 35.6 13.4c1-.4 1.9.6 1.5 1.6L32 32.8c-.3 1-1.5 1.3-2.3.6l-6-4.8-3 2.8c-.7.6-1.8.2-1.9-.7l-.7-5-6.2-2.1c-1.1-.4-1.1-1.9.3-2.2Z"
      />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3.2 11.2 20.4 3.4c.8-.4 1.6.4 1.3 1.2l-3.2 14.2c-.2.8-1.2 1-1.8.5l-4.6-3.7-2.4 2.9c-.5.6-1.5.3-1.6-.5l-.5-4.3-4.7-1.6c-.9-.3-.9-1.6.3-1.9Z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm6 1 4 4"
      />
    </svg>
  );
}
