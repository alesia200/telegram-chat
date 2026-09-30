const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * GREEN-API принимает токен в пути URL, поэтому обычный HTTP запрещён.
 * В development остаётся явное исключение только для localhost.
 *
 * @param {string} apiUrl
 * @param {boolean} allowInsecureLocalhost
 */
export function isSecureApiUrl(apiUrl, allowInsecureLocalhost = false) {
  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    return false;
  }

  if (url.protocol === "https:") return true;
  if (!allowInsecureLocalhost || url.protocol !== "http:") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  return LOCAL_HTTP_HOSTS.has(host);
}
